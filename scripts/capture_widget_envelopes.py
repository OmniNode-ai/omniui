# SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
# SPDX-License-Identifier: MIT

"""Capture sealed widget envelopes from ``omnibase_core`` (OMN-16935, Phase 1B.1).

**This script is a capture tool, not a build step.** It does not run in CI and
nothing in the npm scripts calls it. It runs once, against a checkout of
``omnibase_core``, and writes sealed envelopes into ``src/fixtures/widgets/``.
CI's half is ``src/fixtures/widgets/widgets.test.ts``, which re-derives every
seal in TypeScript and fails if a byte of a fixture moved.

That split is the point. Sealing in Python proves the envelopes are the shapes
``omnibase_core`` actually validates and seals — not shapes hand-typed to look
like them. Re-deriving in TypeScript proves the consumer can verify a seal
without trusting the publisher, which is the property every later discovery gate
rests on. Neither half alone is worth much.

Usage (from the omniui repo root, with an ``omnibase_core`` checkout available)::

    /Users/jonah/Code/omni_home/omnibase_core/.venv/bin/python \\
        scripts/capture_widget_envelopes.py

or, portably::

    OMNIBASE_CORE_PYTHON=<path-to-core-venv-python> \\
        "$OMNIBASE_CORE_PYTHON" scripts/capture_widget_envelopes.py

**On the severity policy, stated plainly rather than implied.**
``ModelSeverityVerdict`` requires severity to be decided upstream by a named,
versioned, digested policy, and it is right to require that: a client that
thresholds a projection itself is inferring authoritative system state. No such
policy artifact ships today — OMN-16777's consumer-flow projection emits
``flow_state``, not a severity. So these fixtures declare the mapping explicitly
as ``SEVERITY_POLICY``, digest it, and carry that digest in every verdict. The
mapping is recorded here so it is reviewable, and it is a **residual**: when the
real policy ships, the fixture is replaced and no component changes, because the
board maps severity to presentation and never computes one.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import Any

from omnibase_core.enums.enum_binding_order_direction import EnumBindingOrderDirection
from omnibase_core.enums.enum_empty_state_reason import EnumEmptyStateReason
from omnibase_core.enums.enum_status_secondary_kind import EnumStatusSecondaryKind
from omnibase_core.enums.enum_status_severity import EnumStatusSeverity
from omnibase_core.enums.enum_widget_type import EnumWidgetType
from omnibase_core.models.dashboard.model_chart_axis_config import ModelChartAxisConfig
from omnibase_core.models.dashboard.model_chart_series_config import (
    ModelChartSeriesConfig,
)
from omnibase_core.models.dashboard.model_component_contract import (
    ModelComponentContract,
)
from omnibase_core.models.dashboard.model_data_binding_contract import (
    ModelDataBindingContract,
)
from omnibase_core.models.dashboard.model_severity_role import ModelSeverityRole
from omnibase_core.models.dashboard.model_severity_verdict import ModelSeverityVerdict
from omnibase_core.models.dashboard.model_status_item_config import (
    ModelStatusItemConfig,
)
from omnibase_core.models.dashboard.model_status_secondary import ModelStatusSecondary
from omnibase_core.models.dashboard.model_widget_config_chart import (
    ModelWidgetConfigChart,
)
from omnibase_core.models.dashboard.model_widget_config_metric_card import (
    ModelWidgetConfigMetricCard,
)
from omnibase_core.models.dashboard.model_widget_config_status_grid import (
    ModelWidgetConfigStatusGrid,
)
from omnibase_core.models.dashboard.model_widget_envelope import ModelWidgetEnvelope
from omnibase_core.models.dashboard.model_widget_provenance import ModelWidgetProvenance
from omnibase_core.models.primitives.model_semver import ModelSemVer
from omnibase_core.utils.util_canonical_hash import compute_canonical_hash
from omnibase_core.utils.util_widget_envelope import (
    seal_widget_envelope,
    verify_widget_envelope,
)

REPO_ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = REPO_ROOT / "src" / "fixtures" / "widgets"

CONSUMER_FLOW_TOPIC = "onex.snapshot.projection.consumer-flow.v1"
CHAIN_LIVENESS_TOPIC = "onex.snapshot.projection.chain-liveness.v1"

#: The flow_state -> severity mapping these fixtures assert upstream decided.
#: Declared here, digested, and carried in every verdict. See the module
#: docstring: no upstream policy artifact ships this yet, and that is a residual.
SEVERITY_POLICY: dict[str, str] = {
    "FLOWING": EnumStatusSeverity.NOMINAL.value,
    # Not an alarm and not proven healthy either: nothing arrived, and nothing
    # upstream claims to have produced anything. Distinct from FLOWING on
    # purpose -- the plan's D4 says IDLE is deliberately not critical, and
    # G1B.2 says it must not render like FLOWING either.
    "IDLE": EnumStatusSeverity.ATTENTION.value,
    "STALLED": EnumStatusSeverity.CRITICAL.value,
    "STARVED": EnumStatusSeverity.CRITICAL.value,
    "UNKNOWN": EnumStatusSeverity.UNKNOWN.value,
}

SEVERITY_POLICY_ID = "onex.policy.consumer-flow-severity"
SEVERITY_POLICY_VERSION = ModelSemVer(major=1, minor=0, patch=0)
SEVERITY_POLICY_DIGEST = f"sha256:{compute_canonical_hash(SEVERITY_POLICY)}"

WIDGET_VERSION = ModelSemVer(major=1, minor=0, patch=0)
CONTRACT_VERSION = ModelSemVer(major=1, minor=0, patch=0)

ALL_EMPTY_STATE_REASONS: tuple[EnumEmptyStateReason, ...] = (
    EnumEmptyStateReason.NO_DATA,
    EnumEmptyStateReason.MISSING_FIELD,
    EnumEmptyStateReason.UPSTREAM_BLOCKED,
    EnumEmptyStateReason.SCHEMA_INVALID,
)

SEVERITY_ROLES: tuple[ModelSeverityRole, ...] = (
    ModelSeverityRole(
        severity=EnumStatusSeverity.NOMINAL,
        theme_color_token="color_status_success",
        label="Nominal",
        icon="circle-check",
    ),
    ModelSeverityRole(
        severity=EnumStatusSeverity.ATTENTION,
        theme_color_token="color_status_warning",
        label="Attention",
        icon="triangle-alert",
    ),
    ModelSeverityRole(
        severity=EnumStatusSeverity.CRITICAL,
        theme_color_token="color_status_error",
        label="Critical",
        icon="octagon-alert",
    ),
    ModelSeverityRole(
        severity=EnumStatusSeverity.UNKNOWN,
        # Deliberately not color_status_info: an informational blue reads as
        # "fine, FYI". "We have no reading" is a muted state, not an info state.
        theme_color_token="color_text_disabled",
        label="Unknown",
        icon="question-diamond",
    ),
)

#: (binding_id, consumer group, tile label, flow_state, secondary value).
#: One entry per row of the OMN-16889 cross-section capture, so every declared
#: flow_state reaches a tile. A ``None`` secondary is the UNKNOWN window whose
#: counters were never observed -- it must not render as zero.
FLOW_TILES: tuple[tuple[str, str, str, str, int | None], ...] = (
    (
        "flow.projection-event-chain",
        "local.omnimarket.projection_event_chain.consume.1.0.0",
        "Event-chain projection",
        "FLOWING",
        1840,
    ),
    (
        "flow.gateway-link-health",
        "local.omnibase_infra.gateway_link_health_projection_compute.consume.1.0.0",
        "Gateway link health",
        "STALLED",
        15750,
    ),
    (
        "flow.gateway-forwarder",
        "local.omnibase_infra.gateway_forwarder.inbound.1.0.0",
        "Gateway forwarder",
        "STARVED",
        0,
    ),
    (
        "flow.version-skew-detector",
        "local.omnimarket.version_skew_detector.consume.1.0.0",
        "Version-skew detector",
        "IDLE",
        0,
    ),
    (
        "flow.ticket-pipeline",
        "local.omnimarket.ticket_pipeline.consume.1.0.0",
        "Ticket pipeline",
        "UNKNOWN",
        None,
    ),
)

FLOW_REQUIRED_FIELDS = (
    "consumer_group",
    "flow_state",
    "messages_in",
    "messages_out",
)


def _verdict(flow_state: str) -> ModelSeverityVerdict:
    """Build the verdict the declared policy assigns to a flow state.

    Args:
        flow_state: A value from the exposure's declared ``flow_state`` domain.

    Returns:
        The verdict, carrying the policy that decided it.
    """
    return ModelSeverityVerdict(
        severity=EnumStatusSeverity(SEVERITY_POLICY[flow_state]),
        status_value=flow_state,
        policy_id=SEVERITY_POLICY_ID,
        policy_version=SEVERITY_POLICY_VERSION,
        policy_digest=SEVERITY_POLICY_DIGEST,
    )


def _flow_binding(binding_id: str) -> ModelDataBindingContract:
    """Bind one tile to the consumer-flow projection.

    Args:
        binding_id: The tile's key, reused as the binding identity.

    Returns:
        The binding.
    """
    return ModelDataBindingContract(
        binding_id=binding_id,
        projection_topic=CONSUMER_FLOW_TOPIC,
        ordering_authority_field="window_end",
        ordering_direction=EnumBindingOrderDirection.DESCENDING,
        required_fields=FLOW_REQUIRED_FIELDS,
    )


def build_system_health_board() -> ModelWidgetEnvelope:
    """The D4 system-health board: a StatusGrid configured by an envelope.

    Returns:
        The sealed envelope.
    """
    bindings = [_flow_binding(binding_id) for binding_id, *_ in FLOW_TILES]
    bindings.append(
        ModelDataBindingContract(
            binding_id="chain.liveness",
            projection_topic=CHAIN_LIVENESS_TOPIC,
            ordering_authority_field="evaluated_at",
            ordering_direction=EnumBindingOrderDirection.DESCENDING,
            required_fields=("chain_id", "liveness_state", "evaluated_at"),
        )
    )

    items = [
        ModelStatusItemConfig(
            key=binding_id,
            label=label,
            icon="queue",
            verdict=_verdict(flow_state),
            secondary=(
                None
                if secondary is None
                else ModelStatusSecondary(
                    kind=EnumStatusSecondaryKind.COUNT,
                    value=float(secondary),
                    label="Messages in",
                )
            ),
        )
        for binding_id, _group, label, flow_state, secondary in FLOW_TILES
    ]
    # The sixth tile binds a projection that does not exist yet (OMN-16779 has
    # not landed). It is in the fixture precisely because it cannot resolve:
    # G1B.2 requires a missing read to render a declared empty state and never a
    # healthy tile, and a gate with no failing case in its fixture is untested.
    items.append(
        ModelStatusItemConfig(
            key="chain.liveness",
            label="Chain liveness",
            icon="chain",
            verdict=ModelSeverityVerdict(
                severity=EnumStatusSeverity.UNKNOWN,
                status_value="NO_PROJECTION",
                policy_id=SEVERITY_POLICY_ID,
                policy_version=SEVERITY_POLICY_VERSION,
                policy_digest=SEVERITY_POLICY_DIGEST,
            ),
            secondary=None,
        )
    )

    return seal_widget_envelope(
        widget_id="onex.widget.system_health_board",
        widget_version=WIDGET_VERSION,
        component=ModelComponentContract(
            component_id="onex.component.system_health_board",
            component_kind=EnumWidgetType.STATUS_GRID,
            title="System health",
            contract_version=CONTRACT_VERSION,
            data_bindings=tuple(bindings),
            supported_empty_state_reasons=ALL_EMPTY_STATE_REASONS,
        ),
        config=ModelWidgetConfigStatusGrid(
            items=tuple(items),
            columns=3,
            show_labels=True,
            compact=False,
            severity_roles=SEVERITY_ROLES,
        ),
        provenance=_provenance(),
    )


def build_throughput_trend() -> ModelWidgetEnvelope:
    """A TrendChart over one consumer group's window series.

    Returns:
        The sealed envelope.
    """
    return seal_widget_envelope(
        widget_id="onex.widget.consumer_flow_throughput",
        widget_version=WIDGET_VERSION,
        component=ModelComponentContract(
            component_id="onex.component.consumer_flow_throughput",
            component_kind=EnumWidgetType.CHART,
            title="Gateway link health throughput",
            contract_version=CONTRACT_VERSION,
            data_bindings=(
                ModelDataBindingContract(
                    binding_id="throughput",
                    projection_topic=CONSUMER_FLOW_TOPIC,
                    ordering_authority_field="window_end",
                    # Ascending: a trend reads left to right in time, and the
                    # binding is where that is declared rather than assumed.
                    ordering_direction=EnumBindingOrderDirection.ASCENDING,
                    required_fields=("window_end", "messages_in", "messages_out"),
                ),
            ),
            supported_empty_state_reasons=ALL_EMPTY_STATE_REASONS,
        ),
        config=ModelWidgetConfigChart(
            chart_type="line",
            series=(
                # `color` is deliberately LEFT UNSET, and that is a finding
                # rather than a preference. The field is documented "Series
                # color (hex)" and is enforced by a hex-format validator, so it
                # can hold a literal and nothing else -- a theme token NAME is
                # rejected outright. A chart whose series colours live in its
                # config renders the same hues under every theme, which is the
                # drift the `svg-and-chart-inputs` rule exists to find and which
                # the theme contract's own docstring forbids. GC.5's grep only
                # covered `ModelWidgetConfig*` DEFAULTS, so this nested field
                # passed it. Recorded as a residual; omniui resolves series
                # colour from the active theme instead, and leaves the field
                # None so no fixture pins a hue.
                ModelChartSeriesConfig(
                    name="Messages in",
                    data_key="messages_in",
                    series_type="line",
                ),
                ModelChartSeriesConfig(
                    name="Messages out",
                    data_key="messages_out",
                    series_type="line",
                ),
            ),
            x_axis=ModelChartAxisConfig(label="Window end", show_grid=False),
            y_axis=ModelChartAxisConfig(label="Messages", show_grid=True),
            show_legend=True,
            stacked=False,
        ),
        provenance=_provenance(),
    )


def build_backlog_cluster() -> ModelWidgetEnvelope:
    """A MetricCluster: one KPI card per bound consumer group.

    Returns:
        The sealed envelope.
    """
    return seal_widget_envelope(
        widget_id="onex.widget.consumer_flow_backlog",
        widget_version=WIDGET_VERSION,
        component=ModelComponentContract(
            component_id="onex.component.consumer_flow_backlog",
            component_kind=EnumWidgetType.METRIC_CARD,
            title="Consumer intake",
            contract_version=CONTRACT_VERSION,
            data_bindings=tuple(
                _flow_binding(binding_id) for binding_id, *_ in FLOW_TILES
            ),
            supported_empty_state_reasons=ALL_EMPTY_STATE_REASONS,
        ),
        config=ModelWidgetConfigMetricCard(
            metric_key="messages_in",
            label="Messages in",
            value_format="number",
            precision=0,
            show_trend=True,
            trend_key="messages_out",
            icon="queue",
        ),
        provenance=_provenance(),
    )


def _provenance() -> ModelWidgetProvenance:
    """Where these envelopes came from.

    No capability pack publishes them: they are first-party fixtures standing in
    for a pack-published envelope, and ``source_revision`` is the
    ``omnibase_core`` commit whose contracts they were sealed against. Verifying
    provenance against a real pack registry is the Phase 2 entry gate's job, not
    this fixture's.

    Returns:
        The provenance block.
    """
    revision = os.environ.get("OMNIUI_CAPTURE_SOURCE_REVISION")
    if revision is None or len(revision) != 40:
        raise SystemExit(
            "set OMNIUI_CAPTURE_SOURCE_REVISION to the full 40-character "
            "omnibase_core commit these envelopes are sealed against"
        )
    return ModelWidgetProvenance(
        pack_namespace="onex.packs.platform",
        pack_name="platform-observability",
        pack_version=ModelSemVer(major=1, minor=0, patch=0),
        source_revision=revision,
    )


CAPTURE_NOTE = (
    "Sealed by scripts/capture_widget_envelopes.py against omnibase_core's own "
    "seal_widget_envelope. The seal is re-derived in TypeScript by "
    "src/fixtures/widgets/widgets.test.ts, so Python and TypeScript are proven "
    "to agree on the canonical form rather than assumed to. Do not hand-edit: "
    "editing a byte without re-sealing makes the fixture fail its own seal, "
    "which is the behaviour under test."
)


def main() -> int:
    """Write every envelope fixture.

    Returns:
        Process exit status.
    """
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    envelopes = {
        "system-health-board.envelope.json": build_system_health_board(),
        "consumer-flow-throughput.envelope.json": build_throughput_trend(),
        "consumer-flow-backlog.envelope.json": build_backlog_cluster(),
    }
    for filename, envelope in envelopes.items():
        verify_widget_envelope(envelope)
        payload: dict[str, Any] = {
            "_capture": {"what": CAPTURE_NOTE},
            "envelope": envelope.model_dump(mode="json"),
        }
        path = OUT_DIR / filename
        path.write_text(json.dumps(payload, indent=2, sort_keys=False) + "\n")
        print(f"wrote {path.relative_to(REPO_ROOT)} {envelope.content_digest}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
