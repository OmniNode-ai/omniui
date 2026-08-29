// SPDX-FileCopyrightText: 2026 OmniNode.ai Inc.
// SPDX-License-Identifier: MIT
//
// GENERATED FILE — DO NOT EDIT.
//
// Source: schema/onex-models.json, itself emitted by omnibase_core's
// scripts/emit_ts_types.py. See schema/PROVENANCE.md for the source commit and
// digest, and run `npm run generate:onex-models` to regenerate.

/**
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "EnumDashboardWidgetType".
 */
export type EnumDashboardWidgetType = ("tile" | "chart" | "table" | "list" | "scalar")
/**
 * Preferred widget shape.
 */
export type EnumDashboardWidgetType1 = ("tile" | "chart" | "table" | "list" | "scalar")
/**
 * Human-readable label.
 */
export type Label = (string | null)
/**
 * Grouping key for sidebar organization.
 */
export type Group = (string | null)
/**
 * Ordering weight; lower renders first.
 */
export type Priority = number
/**
 * Treat as time-series if True.
 */
export type TimeSeries = boolean
/**
 * Units annotation (e.g. 'usd', 'ms').
 */
export type Unit = (string | null)
/**
 * Whether idempotency checking is enabled
 */
export type Enabled = boolean
/**
 * Event attribute to use as the idempotency key (e.g., 'sequence_number', 'event_id')
 */
export type Key = string
/**
 * Unique identifier for the partial update operation. Used for logging, metrics, and debugging.
 */
export type Name = string
/**
 * List of column names to update. Must contain at least one column. Column names must reference columns defined in the projection schema.
 * 
 * @minItems 1
 */
export type Columns = [string, ...(string)[]]
/**
 * Event name that triggers this partial update. Must match pattern: lowercase.segments.vN (e.g., 'node.heartbeat.v1').
 */
export type TriggerEvent = string
/**
 * Whether to skip idempotency checking for this operation. Set to True for inherently idempotent operations like state transitions.
 */
export type SkipIdempotency = boolean
/**
 * Optional SQL condition for when to apply the update. Example: 'ack_timeout_emitted_at IS NULL' for conditional marker setting.
 */
export type Condition = (string | null)
/**
 * Projection mode: upsert, insert_only, or append
 */
export type Mode = ("upsert" | "insert_only" | "append")
/**
 * Column name(s) to use for upsert conflict detection. Can be a single column name (str) or a list of column names for composite keys. Only applicable when mode='upsert'. When None and mode='upsert', the projector runtime falls back to using projection_schema.primary_key as the conflict detection key; a warning is logged in this case to encourage explicit specification. Explicit specification is recommended for clarity and self-documenting configuration. Ignored when mode='insert_only' or 'append'.
 */
export type UpsertKey = (string | string[] | null)
/**
 * Column name in the projection table
 */
export type Name1 = string
/**
 * SQL column type (e.g., 'UUID', 'TEXT', 'JSONB', 'TIMESTAMPTZ', 'INTEGER', 'BOOLEAN'). String type for extensibility.
 */
export type Type = string
/**
 * Path to extract data from the event. Supports dotted notation (e.g., 'event.payload.node_name', 'envelope.sequence_number').
 */
export type Source = string
/**
 * Optional event type filter. When specified, column is only updated when processing events of this specific type.
 */
export type OnEvent = (string | null)
/**
 * Optional default value. Used when source path yields no value or column is created before any relevant event.
 */
export type Default = (string | null)
/**
 * Index name. Auto-generated if not provided.
 */
export type Name2 = (string | null)
/**
 * Columns to index. Must contain at least one column.
 * 
 * @minItems 1
 */
export type Columns1 = [string, ...(string)[]]
/**
 * Index type: btree (default), gin, or hash.
 */
export type Type1 = ("btree" | "gin" | "hash")
/**
 * Whether to enforce unique constraint on indexed columns.
 */
export type Unique = boolean
/**
 * Target database table name for the projection
 */
export type Table = string
/**
 * Column name(s) to use as the primary key. Can be a single column name (str) or a list of column names for composite primary keys.
 */
export type PrimaryKey = (string | string[])
/**
 * List of column definitions. Must contain at least one column.
 * 
 * @minItems 1
 */
export type Columns2 = [ModelProjectorColumn, ...(ModelProjectorColumn)[]]
/**
 * Optional list of index definitions for the projection table. Defaults to an empty list if not specified.
 */
export type Indexes = ModelProjectorIndex[]
/**
 * Major version number
 */
export type Major = number
/**
 * Minor version number
 */
export type Minor = number
/**
 * Patch version number
 */
export type Patch = number
/**
 * Prerelease identifiers (dot-separated in string form)
 */
export type Prerelease = ((string | number)[] | null)
/**
 * Build metadata identifiers (ignored for precedence)
 */
export type Build = (string[] | null)
/**
 * Type of projector. Currently only 'materialized_view' is supported.
 */
export type ProjectorKind = "materialized_view"
/**
 * Unique identifier for the projector
 */
export type ProjectorId = string
/**
 * Human-readable name for the projector
 */
export type Name3 = string
/**
 * Contract version string (e.g., '1.0.0')
 */
export type Version = string
/**
 * Semantic identifier for the aggregate type this projector handles
 */
export type AggregateType = string
/**
 * List of event names to consume. Must contain at least one event. Each event name must match pattern: lowercase.segments.vN
 * 
 * @minItems 1
 */
export type ConsumedEvents = [string, ...(string)[]]
/**
 * Optional list of partial update operations. Each operation defines a subset of columns to update when triggered by a specific event. Partial updates are more efficient than full upserts for high-frequency updates like heartbeats or state transitions.
 */
export type PartialUpdates = ModelPartialUpdateOperation[]
/**
 * Type of the aggregate (e.g., 'registration', 'intelligence')
 */
export type AggregateType1 = string
/**
 * Unique identifier of the aggregate instance
 */
export type AggregateId = string
/**
 * The FSM state before the transition
 */
export type FromState = string
/**
 * The FSM state after the transition
 */
export type ToState = string
/**
 * Monotonically increasing version of the projection
 */
export type ProjectionVersion = number
/**
 * Correlation ID linking this to the original request
 */
export type CorrelationId = string
/**
 * ID of the event that caused this transition
 */
export type CausationId = string
/**
 * When the transition was committed (UTC recommended)
 */
export type Timestamp = string
/**
 * Hash of the full projection state for integrity verification
 */
export type ProjectionHash = (string | null)
/**
 * Bounded view of state for orchestrator workflow decisions
 */
export type WorkflowView = ({
[k: string]: unknown
} | null)
/**
 * Direction the upstream projection orders its rows by.
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "EnumBindingOrderDirection".
 */
export type EnumBindingOrderDirection = ("ascending" | "descending")
/**
 * Durability of the effect a UI action commits, lowest to highest.
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "EnumCommitLevel".
 */
export type EnumCommitLevel = ("read_only" | "reversible" | "irreversible")
/**
 * Typed reason a UI component renders an empty/error state.
 * 
 * Mirrors the ``EmptyStateReason`` TS union exactly (four values, no more).
 * A renderer MUST NOT collapse ``SCHEMA_INVALID`` into ``NO_DATA`` — each
 * reason maps to a distinct operator diagnostic.
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "EnumEmptyStateReason".
 */
export type EnumEmptyStateReason = ("no-data" | "missing-field" | "upstream-blocked" | "schema-invalid")
/**
 * The moment at which an evidence requirement is enforced.
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "EnumEvidenceGateMoment".
 */
export type EnumEvidenceGateMoment = ("on-render" | "on-commit")
/**
 * Types of evidence required for ticket contract validation.
 * 
 * Evidence kinds specify what type of proof is required:
 * - TESTS: Automated test coverage
 * - DOCS: Documentation updates
 * - CI: CI/CD pipeline changes
 * - BENCHMARK: Performance benchmarks
 * - MANUAL: Manual verification steps
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "EnumEvidenceKind".
 */
export type EnumEvidenceKind = ("tests" | "docs" | "ci" | "benchmark" | "manual")
/**
 * Types of gates that require approval.
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "EnumGateKind".
 */
export type EnumGateKind = ("human_approval" | "policy_check" | "security_check")
/**
 * Risk level of executing a UI action, lowest to highest.
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "EnumRiskLevel".
 */
export type EnumRiskLevel = ("low" | "medium" | "high" | "critical")
/**
 * Status values for ticket verification steps and gates.
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "EnumTicketStepStatus".
 */
export type EnumTicketStepStatus = ("pending" | "passed" | "failed" | "skipped" | "approved" | "rejected")
/**
 * Dashboard widget type enumeration.
 * 
 * Defines the types of widgets available for dashboard configuration.
 * Each type has specific configuration requirements and rendering behavior.
 * Widget types are categorized as either data-bound (requiring continuous
 * data updates) or aggregation-based (displaying point-in-time metrics).
 * 
 * Attributes:
 *     CHART: Line, bar, area, pie, or scatter chart visualization.
 *         Config: :class:`~omnibase_core.models.dashboard.ModelWidgetConfigChart`
 *     TABLE: Paginated, sortable tabular data display.
 *         Config: :class:`~omnibase_core.models.dashboard.ModelWidgetConfigTable`
 *     METRIC_CARD: Single KPI display with optional trend and thresholds.
 *         Config: :class:`~omnibase_core.models.dashboard.ModelWidgetConfigMetricCard`
 *     STATUS_GRID: Grid of status indicators for system health monitoring.
 *         Config: :class:`~omnibase_core.models.dashboard.ModelWidgetConfigStatusGrid`
 *     EVENT_FEED: Real-time event stream with filtering capabilities.
 *         Config: :class:`~omnibase_core.models.dashboard.ModelWidgetConfigEventFeed`
 * 
 * Example:
 *     Use in widget definition::
 * 
 *         from omnibase_core.enums import EnumWidgetType
 * 
 *         # Check if widget needs real-time data binding
 *         if EnumWidgetType.TABLE.is_data_bound:
 *             setup_data_subscription()
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "EnumWidgetType".
 */
export type EnumWidgetType = ("chart" | "table" | "metric_card" | "status_grid" | "event_feed")
/**
 * Stable semantic identifier for this action within a component
 */
export type ActionId = string
/**
 * Canonical onex.cmd.* topic this action emits onto the bus
 */
export type CommandTopic = string
/**
 * Human-readable label rendered on the action control
 */
export type Label1 = string
/**
 * Unique identifier for the gate
 */
export type Id = string
/**
 * Type of gate
 */
export type EnumGateKind1 = ("human_approval" | "policy_check" | "security_check")
/**
 * Description of what needs approval
 */
export type Description = string
/**
 * Whether approval is required
 */
export type Required = boolean
/**
 * Current status of the gate
 */
export type EnumTicketStepStatus1 = ("pending" | "passed" | "failed" | "skipped" | "approved" | "rejected")
/**
 * Who approved/rejected
 */
export type Approver = (string | null)
/**
 * When the decision was made
 */
export type DecidedAt = (string | null)
/**
 * Minimum upstream confidence (0.0-1.0) for the action to proceed without escalation
 */
export type ConfidenceThreshold = number
/**
 * Whether explicit user confirmation is required before emit
 */
export type RequiresUserConfirmation = boolean
/**
 * Typed user-facing risk of executing the action
 */
export type EnumRiskLevel1 = ("low" | "medium" | "high" | "critical")
/**
 * Whether the committed effect can be undone
 */
export type Reversible = boolean
/**
 * Typed durability of the effect the action commits
 */
export type EnumCommitLevel1 = ("read_only" | "reversible" | "irreversible")
/**
 * Whether every emission must carry a correlation ID
 */
export type CorrelationRequired = boolean
/**
 * Stable semantic identifier for this binding within a component
 */
export type BindingId = string
/**
 * Canonical projection topic read via /projection/{topic}; no raw DB
 */
export type ProjectionTopic = string
/**
 * Column the upstream projection orders by (explicit ordering authority)
 */
export type OrderingAuthorityField = string
/**
 * Direction the ordering-authority field is ordered by upstream
 */
export type EnumBindingOrderDirection1 = ("ascending" | "descending")
/**
 * Projection row fields this component requires to render
 */
export type RequiredFields = string[]
/**
 * Optional pagination cursor field exposed by the projection
 */
export type CursorField = (string | null)
/**
 * Type of evidence
 */
export type EnumEvidenceKind1 = ("tests" | "docs" | "ci" | "benchmark" | "manual")
/**
 * What evidence must exist
 */
export type Description1 = string
/**
 * How to reproduce, if applicable
 */
export type Command = (string | null)
/**
 * Stable semantic identifier for this evidence requirement contract
 */
export type ContractId = string
/**
 * Whether the evidence gates a panel render or an action commit
 */
export type EnumEvidenceGateMoment1 = ("on-render" | "on-commit")
/**
 * Operator-facing message shown when the requirement is unmet
 */
export type UnmetDisplayMessage = string
/**
 * Stable semantic identifier for this permission contract
 */
export type PermissionId = string
/**
 * Scopes required to see the component; empty means visible to all
 */
export type ViewScopes = string[]
/**
 * Scopes required to act; empty means no extra scope beyond view
 */
export type ActScopes = string[]
/**
 * Declared reason shown when the viewer may see but not act
 */
export type DisabledReason = string
/**
 * Stable semantic identifier for this component contract
 */
export type ComponentId = string
/**
 * Shipped component kind a renderer must support to render this
 */
export type EnumWidgetType1 = ("chart" | "table" | "metric_card" | "status_grid" | "event_feed")
/**
 * Human-readable component title
 */
export type Title = string
/**
 * Projection bindings this component reads truth from
 */
export type DataBindings = ModelDataBindingContract[]
/**
 * Declared command-emitting actions this component exposes
 */
export type Actions = ModelActionContract[]
/**
 * Evidence required before this component renders or commits
 */
export type EvidenceRequirements = ModelEvidenceRequirementContract[]
/**
 * Typed empty-state reasons this component can surface
 */
export type SupportedEmptyStateReasons = EnumEmptyStateReason[]
/**
 * WCAG-aligned accessibility conformance tier.
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "EnumAccessibilityTier".
 */
export type EnumAccessibilityTier = ("a" | "aa" | "aaa")
/**
 * How a user interacts with a renderer.
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "EnumRendererInteractionModel".
 */
export type EnumRendererInteractionModel = ("pointer" | "touch" | "keyboard" | "voice")
/**
 * Stable renderer identifier (e.g. 'ui.effect.web', 'ui.effect.cli')
 */
export type RendererId = string
/**
 * Target platform the renderer runs on (e.g. 'web', 'ios', 'cli')
 */
export type Platform = string
/**
 * Component kinds this renderer can render (shipped EnumWidgetType)
 */
export type SupportedComponentKinds = EnumWidgetType[]
/**
 * Interaction model the renderer advertises
 */
export type EnumRendererInteractionModel1 = ("pointer" | "touch" | "keyboard" | "voice")
/**
 * WCAG-aligned accessibility tier the renderer guarantees
 */
export type EnumAccessibilityTier1 = ("a" | "aa" | "aaa")
/**
 * Whether the renderer can emit user-driven command actions
 */
export type SupportsInteraction = boolean
/**
 * Whether the renderer can consume streaming projection updates
 */
export type SupportsStreaming = boolean
/**
 * Whether the renderer honors a versioned theme contract
 */
export type SupportsTheming = boolean
/**
 * Stable, namespaced theme identifier (e.g. 'onex.theme.dark.v1', 'onex.theme.light.v1')
 */
export type ThemeId = string
/**
 * Primary page/panel background (e.g. '#0f172a')
 */
export type ColorBackgroundPrimary = string
/**
 * Secondary / sidebar background
 */
export type ColorBackgroundSecondary = string
/**
 * Elevated surface background (cards, dropdowns)
 */
export type ColorBackgroundElevated = string
/**
 * Primary body text color
 */
export type ColorTextPrimary = string
/**
 * Secondary / muted text color
 */
export type ColorTextSecondary = string
/**
 * Disabled / placeholder text color
 */
export type ColorTextDisabled = string
/**
 * Primary brand / interactive accent color
 */
export type ColorAccentPrimary = string
/**
 * Secondary / hover accent color
 */
export type ColorAccentSecondary = string
/**
 * Success / green semantic color
 */
export type ColorStatusSuccess = string
/**
 * Warning / amber semantic color
 */
export type ColorStatusWarning = string
/**
 * Error / red semantic color
 */
export type ColorStatusError = string
/**
 * Informational / blue semantic color
 */
export type ColorStatusInfo = string
/**
 * Default / subtle border color
 */
export type ColorBorderDefault = string
/**
 * Strong / emphasized border color
 */
export type ColorBorderStrong = string
/**
 * Extra-small spacing token (e.g. '0.25rem')
 */
export type SpacingXs = string
/**
 * Small spacing token (e.g. '0.5rem')
 */
export type SpacingSm = string
/**
 * Medium / base spacing token (e.g. '1rem')
 */
export type SpacingMd = string
/**
 * Large spacing token (e.g. '1.5rem')
 */
export type SpacingLg = string
/**
 * Extra-large spacing token (e.g. '2rem')
 */
export type SpacingXl = string
/**
 * Base / body font-family stack (e.g. "'Inter', system-ui, sans-serif")
 */
export type FontFamilyBase = string
/**
 * Small font size (e.g. '0.875rem')
 */
export type FontSizeSm = string
/**
 * Medium / body font size (e.g. '1rem')
 */
export type FontSizeMd = string
/**
 * Large font size (e.g. '1.125rem')
 */
export type FontSizeLg = string
/**
 * Normal font weight (e.g. '400')
 */
export type FontWeightNormal = string
/**
 * Bold font weight (e.g. '700')
 */
export type FontWeightBold = string
/**
 * Small border radius (e.g. '0.25rem')
 */
export type BorderRadiusSm = string
/**
 * Medium border radius (e.g. '0.5rem')
 */
export type BorderRadiusMd = string
/**
 * Large border radius (e.g. '1rem')
 */
export type BorderRadiusLg = string
/**
 * Stable, namespaced theme identifier (e.g. 'onex.theme.dark'). Must equal the embedded token set's theme_id.
 */
export type ThemeId1 = string
/**
 * Human-readable description of what this theme revision is for
 */
export type Summary = string
/**
 * Namespaced theme identifier (e.g. 'onex.theme.dark')
 */
export type ThemeId2 = string
/**
 * SHA-256 over the published bytes, as 'sha256:<hex>'
 */
export type ContentDigest = string
/**
 * Catalog-root-relative path of the instance document
 */
export type SourcePath = string
/**
 * Published, immutable theme revisions
 */
export type Entries = ModelThemeCatalogEntry[]
/**
 * Surface whose active theme this pointer describes (e.g. 'omnidash')
 */
export type SurfaceId = string
/**
 * Namespaced theme identifier this surface renders
 */
export type ThemeId3 = string
/**
 * Digest resolved from the catalog at activation time. Two surfaces on one entry must report the same value (GC.2).
 */
export type ContentDigest1 = string
/**
 * Monotonic activation counter for this surface; first activation is 1
 */
export type ActivationSequence = number
/**
 * Kind of numeric secondary displayed alongside a tile's status.
 * 
 * Attributes:
 *     COUNT: A cardinality — quarantined messages, failing nodes.
 *     DEPTH: A backlog size — DLQ depth, consumer lag.
 *     RATE: A per-interval rate — arrivals per minute.
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "EnumStatusSecondaryKind".
 */
export type EnumStatusSecondaryKind = ("count" | "depth" | "rate")
/**
 * Semantic severity role of a status tile.
 * 
 * Attributes:
 *     NOMINAL: Operating as expected.
 *     UNKNOWN: State could not be determined. Not an alarm, not an all-clear.
 *     ATTENTION: Degraded or trending wrong; a human should look.
 *     CRITICAL: Failing now.
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "EnumStatusSeverity".
 */
export type EnumStatusSeverity = ("nominal" | "unknown" | "attention" | "critical")
/**
 * Axis label
 */
export type Label2 = (string | null)
/**
 * Minimum axis value
 */
export type MinValue = (number | null)
/**
 * Maximum axis value
 */
export type MaxValue = (number | null)
/**
 * Show grid lines
 */
export type ShowGrid = boolean
/**
 * Series display name
 */
export type Name4 = string
/**
 * Key to extract data from source
 */
export type DataKey = string
/**
 * Series color (hex)
 */
export type Color = (string | null)
/**
 * How to render this series
 */
export type SeriesType = ("line" | "bar" | "area" | "scatter")
/**
 * Event types to include (empty = all)
 */
export type EventTypes = string[]
/**
 * Severity levels to include (empty = all)
 */
export type SeverityLevels = string[]
/**
 * Event sources to include (empty = all)
 */
export type Sources = string[]
/**
 * Threshold value
 */
export type Value = number
/**
 * Color when threshold is reached (hex)
 */
export type Color1 = string
/**
 * Threshold label
 */
export type Label3 = (string | null)
/**
 * Semantic severity this role renders
 */
export type EnumStatusSeverity1 = ("nominal" | "unknown" | "attention" | "critical")
/**
 * Name of the ModelRendererThemeContract token this severity resolves to (e.g. 'color_status_error'). A NAME, never a colour value.
 */
export type ThemeColorToken = string
/**
 * Text label rendered for this severity; never colour alone
 */
export type Label4 = string
/**
 * Icon/shape identifier rendered for this severity; distinct per severity
 */
export type Icon = string
/**
 * Canonical semantic severity decided upstream
 */
export type EnumStatusSeverity2 = ("nominal" | "unknown" | "attention" | "critical")
/**
 * The upstream verdict in its own vocabulary (e.g. 'STALLED', 'STARVED'), preserved so the tile can show what was actually said
 */
export type StatusValue = string
/**
 * Identifier of the policy that produced this verdict
 */
export type PolicyId = string
/**
 * SHA-256 of the policy revision, as 'sha256:<hex>'
 */
export type PolicyDigest = string
/**
 * Data key for this status item
 */
export type Key1 = string
/**
 * Display label
 */
export type Label5 = string
/**
 * Icon identifier for the thing being monitored (a database, a queue). Distinct from the severity icon, which comes from the grid's severity role and is never optional.
 */
export type Icon1 = (string | null)
/**
 * What the number measures: count, depth, or rate
 */
export type EnumStatusSecondaryKind1 = ("count" | "depth" | "rate")
/**
 * The measured value as delivered by the upstream projection
 */
export type Value1 = number
/**
 * Short human-readable label for the number (e.g. 'DLQ depth')
 */
export type Label6 = string
/**
 * Unit or per-interval suffix (e.g. 'msg/min'). None where the number is dimensionless, which a count usually is.
 */
export type Unit1 = (string | null)
/**
 * Data key for this column
 */
export type Key2 = string
/**
 * Column header display text
 */
export type Header = string
/**
 * Column width in pixels (minimum 1 when set)
 */
export type Width = (number | null)
/**
 * Allow sorting by this column
 */
export type Sortable = boolean
/**
 * Text alignment
 */
export type Align = ("left" | "center" | "right")
/**
 * Display format (e.g., 'currency', 'percent', 'date')
 */
export type Format = (string | null)
/**
 * Discriminator for widget config union
 */
export type ConfigKind = "chart"
/**
 * Dashboard widget type enumeration.
 * 
 * Defines the types of widgets available for dashboard configuration.
 * Each type has specific configuration requirements and rendering behavior.
 * Widget types are categorized as either data-bound (requiring continuous
 * data updates) or aggregation-based (displaying point-in-time metrics).
 * 
 * Attributes:
 *     CHART: Line, bar, area, pie, or scatter chart visualization.
 *         Config: :class:`~omnibase_core.models.dashboard.ModelWidgetConfigChart`
 *     TABLE: Paginated, sortable tabular data display.
 *         Config: :class:`~omnibase_core.models.dashboard.ModelWidgetConfigTable`
 *     METRIC_CARD: Single KPI display with optional trend and thresholds.
 *         Config: :class:`~omnibase_core.models.dashboard.ModelWidgetConfigMetricCard`
 *     STATUS_GRID: Grid of status indicators for system health monitoring.
 *         Config: :class:`~omnibase_core.models.dashboard.ModelWidgetConfigStatusGrid`
 *     EVENT_FEED: Real-time event stream with filtering capabilities.
 *         Config: :class:`~omnibase_core.models.dashboard.ModelWidgetConfigEventFeed`
 * 
 * Example:
 *     Use in widget definition::
 * 
 *         from omnibase_core.enums import EnumWidgetType
 * 
 *         # Check if widget needs real-time data binding
 *         if EnumWidgetType.TABLE.is_data_bound:
 *             setup_data_subscription()
 */
export type EnumWidgetType2 = ("chart" | "table" | "metric_card" | "status_grid" | "event_feed")
/**
 * Primary chart visualization type
 */
export type ChartType = ("line" | "bar" | "area" | "pie" | "scatter")
/**
 * Chart series configurations
 */
export type Series = ModelChartSeriesConfig[]
/**
 * Show chart legend
 */
export type ShowLegend = boolean
/**
 * Stack series values
 */
export type Stacked = boolean
/**
 * Discriminator for widget config union
 */
export type ConfigKind1 = "event_feed"
/**
 * Dashboard widget type enumeration.
 * 
 * Defines the types of widgets available for dashboard configuration.
 * Each type has specific configuration requirements and rendering behavior.
 * Widget types are categorized as either data-bound (requiring continuous
 * data updates) or aggregation-based (displaying point-in-time metrics).
 * 
 * Attributes:
 *     CHART: Line, bar, area, pie, or scatter chart visualization.
 *         Config: :class:`~omnibase_core.models.dashboard.ModelWidgetConfigChart`
 *     TABLE: Paginated, sortable tabular data display.
 *         Config: :class:`~omnibase_core.models.dashboard.ModelWidgetConfigTable`
 *     METRIC_CARD: Single KPI display with optional trend and thresholds.
 *         Config: :class:`~omnibase_core.models.dashboard.ModelWidgetConfigMetricCard`
 *     STATUS_GRID: Grid of status indicators for system health monitoring.
 *         Config: :class:`~omnibase_core.models.dashboard.ModelWidgetConfigStatusGrid`
 *     EVENT_FEED: Real-time event stream with filtering capabilities.
 *         Config: :class:`~omnibase_core.models.dashboard.ModelWidgetConfigEventFeed`
 * 
 * Example:
 *     Use in widget definition::
 * 
 *         from omnibase_core.enums import EnumWidgetType
 * 
 *         # Check if widget needs real-time data binding
 *         if EnumWidgetType.TABLE.is_data_bound:
 *             setup_data_subscription()
 */
export type EnumWidgetType3 = ("chart" | "table" | "metric_card" | "status_grid" | "event_feed")
/**
 * Maximum events to display
 */
export type MaxItems = number
/**
 * Show event timestamps
 */
export type ShowTimestamp = boolean
/**
 * Show event source
 */
export type ShowSource = boolean
/**
 * Show severity indicator
 */
export type ShowSeverity = boolean
/**
 * Group events by type
 */
export type GroupByType = boolean
/**
 * Auto-scroll to new events
 */
export type AutoScroll = boolean
/**
 * Discriminator for widget config union
 */
export type ConfigKind2 = "metric_card"
/**
 * Dashboard widget type enumeration.
 * 
 * Defines the types of widgets available for dashboard configuration.
 * Each type has specific configuration requirements and rendering behavior.
 * Widget types are categorized as either data-bound (requiring continuous
 * data updates) or aggregation-based (displaying point-in-time metrics).
 * 
 * Attributes:
 *     CHART: Line, bar, area, pie, or scatter chart visualization.
 *         Config: :class:`~omnibase_core.models.dashboard.ModelWidgetConfigChart`
 *     TABLE: Paginated, sortable tabular data display.
 *         Config: :class:`~omnibase_core.models.dashboard.ModelWidgetConfigTable`
 *     METRIC_CARD: Single KPI display with optional trend and thresholds.
 *         Config: :class:`~omnibase_core.models.dashboard.ModelWidgetConfigMetricCard`
 *     STATUS_GRID: Grid of status indicators for system health monitoring.
 *         Config: :class:`~omnibase_core.models.dashboard.ModelWidgetConfigStatusGrid`
 *     EVENT_FEED: Real-time event stream with filtering capabilities.
 *         Config: :class:`~omnibase_core.models.dashboard.ModelWidgetConfigEventFeed`
 * 
 * Example:
 *     Use in widget definition::
 * 
 *         from omnibase_core.enums import EnumWidgetType
 * 
 *         # Check if widget needs real-time data binding
 *         if EnumWidgetType.TABLE.is_data_bound:
 *             setup_data_subscription()
 */
export type EnumWidgetType4 = ("chart" | "table" | "metric_card" | "status_grid" | "event_feed")
/**
 * Key to extract metric value from data
 */
export type MetricKey = string
/**
 * Metric display label
 */
export type Label7 = string
/**
 * Unit of measurement
 */
export type Unit2 = (string | null)
/**
 * How to format the value
 */
export type Format1 = ("number" | "currency" | "percent" | "duration")
/**
 * Decimal precision
 */
export type Precision = number
/**
 * Show trend indicator
 */
export type ShowTrend = boolean
/**
 * Key for trend comparison value
 */
export type TrendKey = (string | null)
/**
 * Color thresholds for the metric
 */
export type Thresholds = ModelMetricThreshold[]
/**
 * Icon identifier
 */
export type Icon2 = (string | null)
/**
 * Discriminator for widget config union
 */
export type ConfigKind3 = "status_grid"
/**
 * Dashboard widget type enumeration.
 * 
 * Defines the types of widgets available for dashboard configuration.
 * Each type has specific configuration requirements and rendering behavior.
 * Widget types are categorized as either data-bound (requiring continuous
 * data updates) or aggregation-based (displaying point-in-time metrics).
 * 
 * Attributes:
 *     CHART: Line, bar, area, pie, or scatter chart visualization.
 *         Config: :class:`~omnibase_core.models.dashboard.ModelWidgetConfigChart`
 *     TABLE: Paginated, sortable tabular data display.
 *         Config: :class:`~omnibase_core.models.dashboard.ModelWidgetConfigTable`
 *     METRIC_CARD: Single KPI display with optional trend and thresholds.
 *         Config: :class:`~omnibase_core.models.dashboard.ModelWidgetConfigMetricCard`
 *     STATUS_GRID: Grid of status indicators for system health monitoring.
 *         Config: :class:`~omnibase_core.models.dashboard.ModelWidgetConfigStatusGrid`
 *     EVENT_FEED: Real-time event stream with filtering capabilities.
 *         Config: :class:`~omnibase_core.models.dashboard.ModelWidgetConfigEventFeed`
 * 
 * Example:
 *     Use in widget definition::
 * 
 *         from omnibase_core.enums import EnumWidgetType
 * 
 *         # Check if widget needs real-time data binding
 *         if EnumWidgetType.TABLE.is_data_bound:
 *             setup_data_subscription()
 */
export type EnumWidgetType5 = ("chart" | "table" | "metric_card" | "status_grid" | "event_feed")
/**
 * Status items to display
 */
export type Items = ModelStatusItemConfig[]
/**
 * Number of grid columns
 */
export type Columns3 = number
/**
 * Show item labels
 */
export type ShowLabels = boolean
/**
 * Use compact display mode
 */
export type Compact = boolean
/**
 * Presentation of each severity: theme token NAME, text label, icon. Carries no colour value — that is the theme instance's job.
 */
export type SeverityRoles = ModelSeverityRole[]
/**
 * Discriminator for widget config union
 */
export type ConfigKind4 = "table"
/**
 * Dashboard widget type enumeration.
 * 
 * Defines the types of widgets available for dashboard configuration.
 * Each type has specific configuration requirements and rendering behavior.
 * Widget types are categorized as either data-bound (requiring continuous
 * data updates) or aggregation-based (displaying point-in-time metrics).
 * 
 * Attributes:
 *     CHART: Line, bar, area, pie, or scatter chart visualization.
 *         Config: :class:`~omnibase_core.models.dashboard.ModelWidgetConfigChart`
 *     TABLE: Paginated, sortable tabular data display.
 *         Config: :class:`~omnibase_core.models.dashboard.ModelWidgetConfigTable`
 *     METRIC_CARD: Single KPI display with optional trend and thresholds.
 *         Config: :class:`~omnibase_core.models.dashboard.ModelWidgetConfigMetricCard`
 *     STATUS_GRID: Grid of status indicators for system health monitoring.
 *         Config: :class:`~omnibase_core.models.dashboard.ModelWidgetConfigStatusGrid`
 *     EVENT_FEED: Real-time event stream with filtering capabilities.
 *         Config: :class:`~omnibase_core.models.dashboard.ModelWidgetConfigEventFeed`
 * 
 * Example:
 *     Use in widget definition::
 * 
 *         from omnibase_core.enums import EnumWidgetType
 * 
 *         # Check if widget needs real-time data binding
 *         if EnumWidgetType.TABLE.is_data_bound:
 *             setup_data_subscription()
 */
export type EnumWidgetType6 = ("chart" | "table" | "metric_card" | "status_grid" | "event_feed")
/**
 * Table column configurations
 */
export type Columns4 = ModelTableColumnConfig[]
/**
 * Rows per page
 */
export type PageSize = number
/**
 * Show pagination controls
 */
export type ShowPagination = boolean
/**
 * Default column key to sort by
 */
export type DefaultSortKey = (string | null)
/**
 * Default sort direction (only used when default_sort_key is set)
 */
export type DefaultSortDirection = (("asc" | "desc") | null)
/**
 * Alternate row colors
 */
export type Striped = boolean
/**
 * Highlight row on hover
 */
export type HoverHighlight = boolean
/**
 * Namespace that published this widget (e.g. 'onex.packs.platform')
 */
export type PackNamespace = string
/**
 * Name of the publishing pack within its namespace
 */
export type PackName = string
/**
 * Full 40-character git object id of the source the pack was built from. Abbreviated revisions are rejected: they name a prefix, not a commit.
 */
export type SourceRevision = string
/**
 * Stable, namespaced widget identifier (e.g. 'onex.widget.system_health')
 */
export type WidgetId = string
/**
 * Discriminated widget configuration, keyed by config_kind
 */
export type Config = (ModelWidgetConfigChart | ModelWidgetConfigTable | ModelWidgetConfigMetricCard | ModelWidgetConfigStatusGrid | ModelWidgetConfigEventFeed)
/**
 * SHA-256 over this envelope's canonical JSON excluding this field, as 'sha256:<hex>'. Lets a consumer validate a discovered widget without trusting the publisher.
 */
export type ContentDigest2 = string
export type TicketId = string
export type EvidenceItemId = string
export type CheckType = string
export type Passed = boolean
export type Reason = string
export type Passed1 = boolean
export type Skipped = boolean
export type FrictionLogged = boolean
export type Message = string
export type Checks = ModelReceiptCheckResult[]
export type TicketsChecked = string[]
/**
 * sha256:<hex> reference to the source contract under review
 */
export type SourceContractHash = string
/**
 * sha256:<hex> reference to the IR derived from the contract
 */
export type IrHash = string
/**
 * sha256:<hex> reference to the patch produced for the change
 */
export type PatchHash = string
/**
 * Stable semantic identifier for the OmniStudio review session
 */
export type SessionId = string
/**
 * Immutable tuple of review packets gathered in this session
 */
export type Packets = ModelReviewPacket[]

export interface HttpsOmninodeAiSchemasOmnidashV2Json {
[k: string]: unknown
}
/**
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "ModelDashboardHint".
 */
export interface ModelDashboardHint {
widget_type: EnumDashboardWidgetType1
label?: Label
group?: Group
priority?: Priority
time_series?: TimeSeries
unit?: Unit
}
/**
 * Idempotency configuration for projector event processing.
 * 
 * Idempotency ensures that processing the same event multiple times
 * produces the same result. This is critical for:
 *     - Safe retries after failures
 *     - Event replay during recovery
 *     - Exactly-once processing semantics
 * 
 * Attributes:
 *     enabled: Whether idempotency checking is enabled. When True,
 *         the projector tracks processed event keys and skips
 *         duplicates. Defaults to True.
 *     key: The event attribute to use as the idempotency key.
 *         This field uniquely identifies an event for deduplication.
 *         Common values: "sequence_number", "event_id", "correlation_id".
 * 
 * Examples:
 *     Basic configuration with sequence number:
 * 
 *     >>> config = ModelIdempotencyConfig(key="sequence_number")
 *     >>> config.enabled
 *     True
 *     >>> config.key
 *     'sequence_number'
 * 
 *     Disabled idempotency:
 * 
 *     >>> config = ModelIdempotencyConfig(enabled=False, key="event_id")
 *     >>> config.enabled
 *     False
 * 
 * Note:
 *     **Why from_attributes=True is Required**
 * 
 *     This model uses ``from_attributes=True`` in its ConfigDict to ensure
 *     pytest-xdist compatibility. When running tests with pytest-xdist,
 *     each worker process imports the class independently, creating separate
 *     class objects. The ``from_attributes=True`` flag enables Pydantic's
 *     "duck typing" mode, allowing fixtures from one worker to be validated
 *     in another.
 * 
 *     **Thread Safety**: This model is frozen (immutable) after creation,
 *     making it thread-safe for concurrent read access.
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "ModelIdempotencyConfig".
 */
export interface ModelIdempotencyConfig {
enabled?: Enabled
key: Key
}
/**
 * Partial update operation definition for projector contracts.
 * 
 * Defines a named partial update operation that targets specific columns
 * and is triggered by a specific event. Partial updates are more efficient
 * than full upserts when only a subset of columns needs to be updated.
 * 
 * Partial updates are particularly useful for:
 *     - High-frequency updates (e.g., heartbeats) that should not trigger
 *       full column recalculation.
 *     - State transitions where only the state column changes.
 *     - Timeout markers that set a single timestamp column.
 * 
 * Attributes:
 *     name: Unique identifier for the partial update operation within the
 *         projector contract. Used for logging, metrics, and debugging.
 *     columns: List of column names to update. Must contain at least one
 *         column. Column names must reference columns defined in the
 *         projection schema (validated at contract level).
 *     trigger_event: Event name that triggers this partial update. Must
 *         match the event naming pattern (lowercase.segments.vN).
 *     skip_idempotency: Whether to skip idempotency checking for this
 *         operation. Defaults to False. Set to True for operations that
 *         are inherently idempotent by design (e.g., state transitions
 *         where the new state is deterministic).
 *     condition: Optional SQL condition for when to apply the update.
 *         Use for conditional updates like "only if not already set".
 *         Example: ``"ack_timeout_emitted_at IS NULL"``.
 * 
 * Examples:
 *     Create a heartbeat update operation:
 * 
 *     >>> op = ModelPartialUpdateOperation(
 *     ...     name="heartbeat",
 *     ...     columns=["last_heartbeat_at", "liveness_deadline"],
 *     ...     trigger_event="node.heartbeat.v1",
 *     ... )
 * 
 *     Create a state transition operation with idempotency skipped:
 * 
 *     >>> op = ModelPartialUpdateOperation(
 *     ...     name="state_transition",
 *     ...     columns=["current_state", "updated_at"],
 *     ...     trigger_event="node.state.changed.v1",
 *     ...     skip_idempotency=True,
 *     ... )
 * 
 *     Create a conditional timeout marker:
 * 
 *     >>> op = ModelPartialUpdateOperation(
 *     ...     name="ack_timeout_marker",
 *     ...     columns=["ack_timeout_emitted_at"],
 *     ...     trigger_event="node.ack.timeout.v1",
 *     ...     condition="ack_timeout_emitted_at IS NULL",
 *     ... )
 * 
 * Note:
 *     **Why from_attributes=True is Required**
 * 
 *     This model uses ``from_attributes=True`` in its ConfigDict to ensure
 *     pytest-xdist compatibility. When running tests with pytest-xdist,
 *     each worker process imports the class independently, creating separate
 *     class objects. The ``from_attributes=True`` flag enables Pydantic's
 *     "duck typing" mode, allowing fixtures from one worker to be validated
 *     in another.
 * 
 *     **Thread Safety**: This model is frozen (immutable) after creation,
 *     making it thread-safe for concurrent read access.
 * 
 * See Also:
 *     - :class:`ModelProjectorContract`: Main contract that contains partial updates
 *     - :class:`ModelProjectorBehavior`: Main behavior configuration
 *     - :class:`ModelIdempotencyConfig`: Idempotency configuration
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "ModelPartialUpdateOperation".
 */
export interface ModelPartialUpdateOperation {
name: Name
columns: Columns
trigger_event: TriggerEvent
skip_idempotency?: SkipIdempotency
condition?: Condition
}
/**
 * Projection behavior configuration.
 * 
 * Determines how the projector handles data during projection operations.
 * The mode controls insert/update semantics while idempotency configuration
 * enables exactly-once processing guarantees.
 * 
 * Attributes:
 *     mode: The projection mode. Options are:
 *         - "upsert": Insert or update based on upsert_key (default)
 *         - "insert_only": Insert only, skip existing records
 *         - "append": Always append without deduplication
 *     upsert_key: The column name to use for upsert conflict detection.
 *         Only applicable when ``mode='upsert'``. At runtime, if this is
 *         ``None``, the projector will fall back to using the
 *         ``projection_schema.primary_key`` as the conflict detection key.
 *         While this fallback behavior is valid, explicit specification is
 *         recommended for clarity and to avoid the warning that is logged
 *         when the default is used. Ignored when ``mode='insert_only'``
 *         or ``mode='append'``.
 *     idempotency: Optional idempotency configuration for exactly-once
 *         processing. When enabled, tracks processed events to prevent
 *         duplicate processing on retries or replay.
 * 
 * Examples:
 *     Default upsert behavior:
 * 
 *     >>> behavior = ModelProjectorBehavior()
 *     >>> behavior.mode
 *     'upsert'
 * 
 *     Upsert with node_id as conflict key:
 * 
 *     >>> behavior = ModelProjectorBehavior(mode="upsert", upsert_key="node_id")
 *     >>> behavior.upsert_key
 *     'node_id'
 * 
 *     Append mode for event logs:
 * 
 *     >>> behavior = ModelProjectorBehavior(mode="append")
 *     >>> behavior.mode
 *     'append'
 * 
 *     With idempotency enabled:
 * 
 *     >>> from omnibase_core.models.projectors import ModelIdempotencyConfig
 *     >>> idempotency = ModelIdempotencyConfig(enabled=True, key="event_id")
 *     >>> behavior = ModelProjectorBehavior(mode="upsert", idempotency=idempotency)
 *     >>> behavior.idempotency.enabled
 *     True
 * 
 * Note:
 *     **Why from_attributes=True is Required**
 * 
 *     This model uses ``from_attributes=True`` in its ConfigDict to ensure
 *     pytest-xdist compatibility. When running tests with pytest-xdist,
 *     each worker process imports the class independently, creating separate
 *     class objects. The ``from_attributes=True`` flag enables Pydantic's
 *     "duck typing" mode, allowing fixtures from one worker to be validated
 *     in another.
 * 
 *     **Thread Safety**: This model is frozen (immutable) after creation,
 *     making it thread-safe for concurrent read access.
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "ModelProjectorBehavior".
 */
export interface ModelProjectorBehavior {
mode?: Mode
upsert_key?: UpsertKey
/**
 * Idempotency configuration for exactly-once processing
 */
idempotency?: (ModelIdempotencyConfig | null)
}
/**
 * Column definition with event field mapping.
 * 
 * Defines how a column in a projection table is populated from event data.
 * Each column specifies its name, SQL type, and the source path for data
 * extraction.
 * 
 * Attributes:
 *     name: Column name in the projection table. Must be a valid SQL column
 *         identifier.
 *     type: SQL column type as a string (e.g., "UUID", "TEXT", "JSONB",
 *         "TIMESTAMPTZ", "INTEGER", "BOOLEAN"). String type allows maximum
 *         extensibility for different database backends.
 *     source: Path to extract data from the event. Supports dotted notation
 *         for nested access (e.g., "event.payload.node_name",
 *         "event.metadata.event_id", "envelope.sequence_number").
 *     on_event: Optional event type filter. When specified, this column is
 *         only updated when processing events of this specific type.
 *         Use for columns that should only change on certain events.
 *     default: Optional default value as a string. Used when the source
 *         path yields no value or the column is created before any
 *         relevant event is processed.
 * 
 * Examples:
 *     Create a simple text column:
 * 
 *     >>> column = ModelProjectorColumn(
 *     ...     name="node_name",
 *     ...     type="TEXT",
 *     ...     source="event.payload.node_name",
 *     ... )
 * 
 *     Create a column with conditional update:
 * 
 *     >>> status_col = ModelProjectorColumn(
 *     ...     name="status",
 *     ...     type="TEXT",
 *     ...     source="event.payload.status",
 *     ...     on_event="node.status.changed.v1",
 *     ...     default="UNKNOWN",
 *     ... )
 * 
 *     Create a timestamp column:
 * 
 *     >>> timestamp_col = ModelProjectorColumn(
 *     ...     name="created_at",
 *     ...     type="TIMESTAMPTZ",
 *     ...     source="event.payload.created_at",
 *     ... )
 * 
 * Note:
 *     **Why from_attributes=True is Required**
 * 
 *     This model uses ``from_attributes=True`` in its ConfigDict to ensure
 *     pytest-xdist compatibility. When running tests with pytest-xdist,
 *     each worker process imports the class independently, creating separate
 *     class objects. The ``from_attributes=True`` flag enables Pydantic's
 *     "duck typing" mode, allowing fixtures from one worker to be validated
 *     in another.
 * 
 *     **Thread Safety**: This model is frozen (immutable) after creation,
 *     making it thread-safe for concurrent read access.
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "ModelProjectorColumn".
 */
export interface ModelProjectorColumn {
name: Name1
type: Type
source: Source
on_event?: OnEvent
default?: Default
}
/**
 * Index definition for projection table.
 * 
 * Defines a database index to be created on a projection table. Supports
 * common PostgreSQL index types: btree (default), gin, and hash.
 * 
 * Core Concepts:
 * - **name**: Optional index name. If not provided, the database or
 *   materialization layer will auto-generate one.
 * - **columns**: Required list of columns to index. Must contain at least
 *   one column name.
 * - **type**: Index type - btree (default, B-tree), gin (GIN for arrays/JSONB),
 *   or hash (hash index).
 * - **unique**: Whether to enforce unique constraint on indexed columns.
 * 
 * Example:
 *     ```python
 *     # Simple btree index on user_id
 *     index = ModelProjectorIndex(columns=["user_id"])
 * 
 *     # Unique composite index with explicit name
 *     index = ModelProjectorIndex(
 *         name="idx_user_created",
 *         columns=["user_id", "created_at"],
 *         type="btree",
 *         unique=True,
 *     )
 * 
 *     # GIN index for JSONB/array column
 *     index = ModelProjectorIndex(
 *         columns=["tags"],
 *         type="gin",
 *     )
 *     ```
 * 
 * Note:
 *     **Why from_attributes=True is Required**
 * 
 *     This model uses ``from_attributes=True`` in its ConfigDict to ensure
 *     pytest-xdist compatibility. When running tests with pytest-xdist,
 *     each worker process imports the class independently, creating separate
 *     class objects. The ``from_attributes=True`` flag enables Pydantic's
 *     "duck typing" mode, allowing fixtures from one worker to be validated
 *     in another.
 * 
 *     **Thread Safety**: This model is frozen (immutable) after creation,
 *     making it thread-safe for concurrent read access.
 * 
 *     **ONEX v2.0 Compliance**:
 *         - Suffix-based naming: ModelProjectorIndex
 *         - Pydantic v2 with ConfigDict
 *         - Frozen/immutable after creation
 *         - Extra fields rejected (strict validation)
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "ModelProjectorIndex".
 */
export interface ModelProjectorIndex {
name?: Name2
columns: Columns1
type?: Type1
unique?: Unique
}
/**
 * Database schema for projection.
 * 
 * Defines the complete schema for a projection table, including the table name,
 * primary key, column definitions, optional indexes, and optional version for
 * migration tracking.
 * 
 * Attributes:
 *     table: The target database table name. Must be a valid SQL identifier.
 *     primary_key: The column name to use as the primary key. Must correspond
 *         to one of the defined columns.
 *     columns: List of column definitions. Must contain at least one column.
 *         Each column specifies how event data maps to the projection table.
 *     indexes: Optional list of index definitions. Defaults to empty list.
 *         Indexes can improve query performance on frequently accessed columns.
 *     version: Optional schema version using semantic versioning. Useful for
 *         tracking schema migrations and compatibility.
 * 
 * Examples:
 *     Create a minimal schema:
 * 
 *     >>> from omnibase_core.models.projectors import (
 *     ...     ModelProjectorColumn,
 *     ...     ModelProjectorSchema,
 *     ... )
 *     >>> column = ModelProjectorColumn(
 *     ...     name="node_id",
 *     ...     type="UUID",
 *     ...     source="event.payload.node_id",
 *     ... )
 *     >>> schema = ModelProjectorSchema(
 *     ...     table="nodes",
 *     ...     primary_key="node_id",
 *     ...     columns=[column],
 *     ... )
 * 
 *     Create a schema with indexes and version:
 * 
 *     >>> from omnibase_core.models.projectors import ModelProjectorIndex
 *     >>> from omnibase_core.models.primitives.model_semver import ModelSemVer
 *     >>> schema = ModelProjectorSchema(
 *     ...     table="nodes",
 *     ...     primary_key="node_id",
 *     ...     columns=[
 *     ...         ModelProjectorColumn(
 *     ...             name="node_id",
 *     ...             type="UUID",
 *     ...             source="event.payload.node_id",
 *     ...         ),
 *     ...         ModelProjectorColumn(
 *     ...             name="status",
 *     ...             type="TEXT",
 *     ...             source="event.payload.status",
 *     ...         ),
 *     ...     ],
 *     ...     indexes=[ModelProjectorIndex(columns=["status"])],
 *     ...     version=ModelSemVer(major=1, minor=0, patch=0),
 *     ... )
 * 
 * Note:
 *     **Why from_attributes=True is Required**
 * 
 *     This model uses ``from_attributes=True`` in its ConfigDict to ensure
 *     pytest-xdist compatibility. When running tests with pytest-xdist,
 *     each worker process imports the class independently, creating separate
 *     class objects. The ``from_attributes=True`` flag enables Pydantic's
 *     "duck typing" mode, allowing fixtures from one worker to be validated
 *     in another.
 * 
 *     **Thread Safety**: This model is frozen (immutable) after creation,
 *     making it thread-safe for concurrent read access.
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "ModelProjectorSchema".
 */
export interface ModelProjectorSchema {
table: Table
primary_key: PrimaryKey
columns: Columns2
indexes?: Indexes
/**
 * Optional schema version for migration tracking
 */
version?: (ModelSemVer | null)
}
/**
 * Semantic version model following SemVer 2.0.0 specification.
 * 
 * Full SemVer format: MAJOR.MINOR.PATCH[-prerelease][+build]
 * 
 * Preferred usage (structured format):
 *     >>> version = ModelSemVer(major=0, minor=4, patch=0)
 *     >>> assert str(version) == "0.4.0"
 *     >>> assert version.major == 0 and version.minor == 4
 * 
 * With prerelease and build metadata:
 *     >>> version = ModelSemVer(major=1, minor=0, patch=0, prerelease=("alpha", 1))
 *     >>> assert str(version) == "1.0.0-alpha.1"
 *     >>> assert version.is_prerelease() is True
 * 
 * For parsing external input, use the parse() class method:
 *     >>> version = ModelSemVer.parse("1.0.0-alpha.1+build.123")
 *     >>> assert version.prerelease == ("alpha", 1)
 *     >>> assert version.build == ("build", "123")
 * 
 * Precedence rules (per SemVer spec):
 *     - prerelease < no prerelease (1.0.0-alpha < 1.0.0)
 *     - Numeric identifiers < alphanumeric (1.0.0-1 < 1.0.0-alpha)
 *     - Build metadata is IGNORED for precedence
 * 
 * Note:
 *     String version literals like "1.0.0" are deprecated.
 *     Always use structured format: ModelSemVer(major=X, minor=Y, patch=Z)
 * 
 *     This model is frozen (immutable) and hashable, suitable for use as dict
 *     keys or in sets. Hash is based on major, minor, patch, and prerelease;
 *     build metadata is excluded (see __hash__ docstring for details).
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "ModelSemVer".
 */
export interface ModelSemVer {
major: Major
minor: Minor
patch: Patch
prerelease?: Prerelease
build?: Build
}
/**
 * Declarative projector contract definition.
 * 
 * Defines the complete contract for a projector including its identity,
 * event subscriptions, schema definition, and behavior configuration.
 * 
 * Projectors consume ModelEventEnvelope streams to materialize read-optimized
 * views of aggregate state. They never emit events, intents, or projections
 * themselves.
 * 
 * Attributes:
 *     projector_kind: Type of projector. Currently only "materialized_view"
 *         is supported. Extensible for future projector types.
 *     projector_id: Unique identifier for the projector. Used for registration
 *         and routing.
 *     name: Human-readable name for the projector.
 *     version: Contract version string (e.g., "1.0.0"). Used for version
 *         validation, compatibility checking, and migration tracking.
 *     aggregate_type: Semantic string identifier for the aggregate type this
 *         projector handles.
 *     consumed_events: List of event names this projector subscribes to.
 *         Each event name must match the pattern: lowercase.segments.vN
 *     projection_schema: Database schema definition including table, columns,
 *         and indexes. Named ``projection_schema`` to avoid conflict with
 *         Pydantic's ``BaseModel.schema`` method.
 *     behavior: Projection behavior configuration including mode and idempotency.
 * 
 * Examples:
 *     Create a node status projector:
 * 
 *     >>> from omnibase_core.models.projectors import (
 *     ...     ModelProjectorBehavior,
 *     ...     ModelProjectorColumn,
 *     ...     ModelProjectorContract,
 *     ...     ModelProjectorSchema,
 *     ... )
 *     >>> column = ModelProjectorColumn(
 *     ...     name="node_id",
 *     ...     type="UUID",
 *     ...     source="event.payload.node_id",
 *     ... )
 *     >>> schema = ModelProjectorSchema(
 *     ...     table="nodes",
 *     ...     primary_key="node_id",
 *     ...     columns=[column],
 *     ... )
 *     >>> behavior = ModelProjectorBehavior(mode="upsert")
 *     >>> contract = ModelProjectorContract(
 *     ...     projector_kind="materialized_view",
 *     ...     projector_id="node-projector",
 *     ...     name="Node Projector",
 *     ...     version="1.0.0",
 *     ...     aggregate_type="node",
 *     ...     consumed_events=["node.created.v1"],
 *     ...     projection_schema=schema,
 *     ...     behavior=behavior,
 *     ... )
 * 
 * Note:
 *     **Why from_attributes=True is Required**
 * 
 *     This model uses ``from_attributes=True`` in its ConfigDict to ensure
 *     pytest-xdist compatibility. When running tests with pytest-xdist,
 *     each worker process imports the class independently, creating separate
 *     class objects. The ``from_attributes=True`` flag enables Pydantic's
 *     "duck typing" mode, allowing fixtures from one worker to be validated
 *     in another.
 * 
 *     **Thread Safety**: This model is frozen (immutable) after creation,
 *     making it thread-safe for concurrent read access.
 * 
 * See Also:
 *     - :class:`ModelProjectorSchema`: Schema definition for projection tables
 *     - :class:`ModelProjectorBehavior`: Behavior configuration for projectors
 *     - :class:`ModelIdempotencyConfig`: Idempotency configuration
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "ModelProjectorContract".
 */
export interface ModelProjectorContract {
projector_kind: ProjectorKind
projector_id: ProjectorId
name: Name3
version: Version
aggregate_type: AggregateType
consumed_events: ConsumedEvents
projection_schema: ModelProjectorSchema1
behavior: ModelProjectorBehavior1
partial_updates?: PartialUpdates
/**
 * Optional presentation hint for dashboard rendering.
 */
dashboard?: (ModelDashboardHint | null)
}
/**
 * Database schema definition for the projection
 */
export interface ModelProjectorSchema1 {
table: Table
primary_key: PrimaryKey
columns: Columns2
indexes?: Indexes
/**
 * Optional schema version for migration tracking
 */
version?: (ModelSemVer | null)
}
/**
 * Projection behavior configuration
 */
export interface ModelProjectorBehavior1 {
mode?: Mode
upsert_key?: UpsertKey
/**
 * Idempotency configuration for exactly-once processing
 */
idempotency?: (ModelIdempotencyConfig | null)
}
/**
 * Notification model for state transitions in ONEX aggregates.
 * 
 * Emitted after a reducer commits a state transition, enabling orchestrators
 * to observe and react to state changes without tight coupling.
 * 
 * This model provides all necessary context for an orchestrator to understand:
 * - What aggregate changed (aggregate_type, aggregate_id)
 * - What the transition was (from_state, to_state)
 * - Version information for ordering and idempotency (projection_version)
 * - Correlation and causation for distributed tracing
 * - Optional bounded view of workflow state (workflow_view)
 * 
 * Attributes:
 *     aggregate_type: The type of aggregate (e.g., "registration", "intelligence").
 *         Used for routing notifications to interested orchestrators.
 *     aggregate_id: Unique identifier of the aggregate instance.
 *     from_state: The FSM state before the transition.
 *     to_state: The FSM state after the transition.
 *     projection_version: Monotonically increasing version of the projection.
 *         Used for ordering and detecting missed notifications.
 *     correlation_id: Correlation ID linking this to the original request.
 *     causation_id: ID of the event that caused this transition.
 *     timestamp: When the transition was committed (UTC recommended).
 *     projection_hash: Optional hash of the full projection state.
 *         Enables optimistic concurrency and integrity verification.
 *     reducer_version: Optional version of the reducer that processed the transition.
 *         Useful for debugging and compatibility tracking.
 *     workflow_view: Optional bounded view of state for orchestrator use.
 *         Contains only the fields needed for workflow decisions.
 * 
 * Example:
 *     >>> from datetime import datetime, UTC
 *     >>> from uuid import uuid4
 *     >>>
 *     >>> # Basic notification
 *     >>> notification = ModelStateTransitionNotification(
 *     ...     aggregate_type="registration",
 *     ...     aggregate_id=uuid4(),
 *     ...     from_state="pending",
 *     ...     to_state="active",
 *     ...     projection_version=1,
 *     ...     correlation_id=uuid4(),
 *     ...     causation_id=uuid4(),
 *     ...     timestamp=datetime.now(UTC),
 *     ... )
 *     >>>
 *     >>> # Notification with workflow view
 *     >>> notification_with_view = ModelStateTransitionNotification(
 *     ...     aggregate_type="intelligence",
 *     ...     aggregate_id=uuid4(),
 *     ...     from_state="analyzing",
 *     ...     to_state="completed",
 *     ...     projection_version=5,
 *     ...     correlation_id=uuid4(),
 *     ...     causation_id=uuid4(),
 *     ...     timestamp=datetime.now(UTC),
 *     ...     projection_hash="sha256:abc123",
 *     ...     reducer_version=ModelSemVer(major=1, minor=2, patch=3),
 *     ...     workflow_view={
 *     ...         "analysis_type": "code_review",
 *     ...         "findings_count": 3,
 *     ...         "severity_max": "high",
 *     ...     },
 *     ... )
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "ModelStateTransitionNotification".
 */
export interface ModelStateTransitionNotification {
aggregate_type: AggregateType1
aggregate_id: AggregateId
from_state: FromState
to_state: ToState
projection_version: ProjectionVersion
correlation_id: CorrelationId
causation_id: CausationId
timestamp: Timestamp
projection_hash?: ProjectionHash
/**
 * Version of the reducer that processed the transition
 */
reducer_version?: (ModelSemVer | null)
workflow_view?: WorkflowView
}
/**
 * Declares the command a UI action emits and its approval gate.
 * 
 * The action emits exactly one canonical command topic (a valid ONEX topic
 * suffix whose kind token is ``cmd``). When ``approval_gate`` is present the
 * action requires that gate's approval before it commits; ``ModelGate`` owns
 * the approval semantics. ``correlation_required`` enforces that every emission
 * carries a correlation ID (Phase 1 bus trace depends on this).
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "ModelActionContract".
 */
export interface ModelActionContract {
action_id: ActionId
command_topic: CommandTopic
label: Label1
/**
 * Composed canonical approval gate; None means no approval required
 */
approval_gate?: (ModelGate | null)
/**
 * Composed risk/confidence policy (confidence_threshold, requires_user_confirmation, risk_level, reversible, commit_level); None means no policy-driven gating beyond the approval gate
 */
gate_policy?: (ModelActionGatePolicy | null)
correlation_required?: CorrelationRequired
}
/**
 * A gate that requires approval before proceeding.
 * 
 * Immutability:
 *     This model uses frozen=True, making instances immutable after creation.
 *     This enables safe sharing across threads without synchronization.
 * 
 * Status Values:
 *     Valid: PENDING, APPROVED, REJECTED, SKIPPED, FAILED
 *     Invalid: PASSED (gates use approval semantics, not passed/failed)
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "ModelGate".
 */
export interface ModelGate {
id: Id
kind: EnumGateKind1
description: Description
required?: Required
status?: EnumTicketStepStatus1
approver?: Approver
decided_at?: DecidedAt
}
/**
 * Risk/confidence policy a UI action gate enforces before committing.
 * 
 * A UI action is a declared ``onex.cmd.*`` command emitter (a button). Before
 * that command is emitted, the action gate consults this policy to decide
 * whether to require user confirmation, how to render affordances/disabled
 * states, and what evidence the action must carry. The policy is declarative
 * and platform-neutral; renderers derive behavior from it rather than encoding
 * risk semantics in frontend code.
 * 
 * Attributes:
 *     confidence_threshold: Minimum upstream confidence (0.0-1.0) required for
 *         the action to proceed without escalation. Below this, the gate
 *         escalates (e.g. forces confirmation regardless of other fields).
 *     requires_user_confirmation: Whether the action gate must obtain explicit
 *         user confirmation before the command is emitted.
 *     risk_level: Typed user-facing risk of executing the action.
 *     reversible: Whether the committed effect can be undone. This is the
 *         boolean fast-path; ``commit_level`` carries the full typed ordinal.
 *     commit_level: Typed durability of the effect the action commits
 *         (read-only, reversible, or irreversible).
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "ModelActionGatePolicy".
 */
export interface ModelActionGatePolicy {
confidence_threshold: ConfidenceThreshold
requires_user_confirmation: RequiresUserConfirmation
risk_level: EnumRiskLevel1
reversible: Reversible
commit_level: EnumCommitLevel1
}
/**
 * Declares how a component binds to a projection topic.
 * 
 * The binding names the projection topic, the ordering authority (the column
 * the projection orders by and the direction), and the required fields the
 * component consumes. Missing fields surface as a typed empty-state reason at
 * render time, never a fallback literal.
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "ModelDataBindingContract".
 */
export interface ModelDataBindingContract {
binding_id: BindingId
projection_topic: ProjectionTopic
ordering_authority_field: OrderingAuthorityField
ordering_direction?: EnumBindingOrderDirection1
required_fields?: RequiredFields
cursor_field?: CursorField
}
/**
 * Evidence requirement in ticket contract.
 * 
 * Declares what type of evidence must exist before a ticket can be marked Done.
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "ModelEvidenceRequirement".
 */
export interface ModelEvidenceRequirement {
kind: EnumEvidenceKind1
description: Description1
command?: Command
}
/**
 * Declares evidence required before an action commits or a panel renders.
 * 
 * Composes the canonical OCC ``ModelEvidenceRequirement`` rather than
 * redefining its fields. ``gate_moment`` says whether the evidence gates a
 * render or a commit; ``unmet_display_message`` is the operator-facing message
 * surfaced when the requirement is not satisfied.
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "ModelEvidenceRequirementContract".
 */
export interface ModelEvidenceRequirementContract {
contract_id: ContractId
requirement: ModelEvidenceRequirement1
gate_moment: EnumEvidenceGateMoment1
unmet_display_message: UnmetDisplayMessage
}
/**
 * Canonical OCC evidence requirement composed into this UI contract
 */
export interface ModelEvidenceRequirement1 {
kind: EnumEvidenceKind1
description: Description1
command?: Command
}
/**
 * Declares the scopes required to view and to act, plus disabled reasons.
 * 
 * ``view_scopes`` gate visibility; ``act_scopes`` gate interaction. When a
 * viewer is permitted to see but not act, the action renders disabled and
 * ``disabled_reason`` states why — a declared reason is mandatory, never a
 * silent disable.
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "ModelPermissionContract".
 */
export interface ModelPermissionContract {
permission_id: PermissionId
view_scopes?: ViewScopes
act_scopes?: ActScopes
disabled_reason: DisabledReason
}
/**
 * A platform-neutral declaration of a UI component.
 * 
 * ``component_kind`` reuses the shipped ``EnumWidgetType`` so a renderer's
 * advertised ``supported_component_kinds`` can gate rendering. ``data_bindings``,
 * ``actions``, ``evidence_requirements``, and ``permission`` compose the other
 * Phase 0 primitives. ``supported_empty_state_reasons`` declares which typed
 * reasons this component can surface; the client never blanks silently.
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "ModelComponentContract".
 */
export interface ModelComponentContract {
component_id: ComponentId
component_kind: EnumWidgetType1
title: Title
contract_version: ModelSemVer1
data_bindings?: DataBindings
actions?: Actions
evidence_requirements?: EvidenceRequirements
/**
 * Permission contract gating who may see/act; None means unrestricted
 */
permission?: (ModelPermissionContract | null)
supported_empty_state_reasons?: SupportedEmptyStateReasons
}
/**
 * Semantic version model following SemVer 2.0.0 specification.
 * 
 * Full SemVer format: MAJOR.MINOR.PATCH[-prerelease][+build]
 * 
 * Preferred usage (structured format):
 *     >>> version = ModelSemVer(major=0, minor=4, patch=0)
 *     >>> assert str(version) == "0.4.0"
 *     >>> assert version.major == 0 and version.minor == 4
 * 
 * With prerelease and build metadata:
 *     >>> version = ModelSemVer(major=1, minor=0, patch=0, prerelease=("alpha", 1))
 *     >>> assert str(version) == "1.0.0-alpha.1"
 *     >>> assert version.is_prerelease() is True
 * 
 * For parsing external input, use the parse() class method:
 *     >>> version = ModelSemVer.parse("1.0.0-alpha.1+build.123")
 *     >>> assert version.prerelease == ("alpha", 1)
 *     >>> assert version.build == ("build", "123")
 * 
 * Precedence rules (per SemVer spec):
 *     - prerelease < no prerelease (1.0.0-alpha < 1.0.0)
 *     - Numeric identifiers < alphanumeric (1.0.0-1 < 1.0.0-alpha)
 *     - Build metadata is IGNORED for precedence
 * 
 * Note:
 *     String version literals like "1.0.0" are deprecated.
 *     Always use structured format: ModelSemVer(major=X, minor=Y, patch=Z)
 * 
 *     This model is frozen (immutable) and hashable, suitable for use as dict
 *     keys or in sets. Hash is based on major, minor, patch, and prerelease;
 *     build metadata is excluded (see __hash__ docstring for details).
 */
export interface ModelSemVer1 {
major: Major
minor: Minor
patch: Patch
prerelease?: Prerelease
build?: Build
}
/**
 * A renderer's advertised capability surface.
 * 
 * ``supported_component_kinds`` reuses the shipped ``EnumWidgetType``
 * vocabulary so capability negotiation is anchored on the component kinds that
 * already exist. The ``supports_*`` flags express granular interaction
 * capabilities a contract may require. ``contract_version`` lets the capability
 * projection track schema drift per renderer.
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "ModelRendererCapabilityContract".
 */
export interface ModelRendererCapabilityContract {
renderer_id: RendererId
platform: Platform
supported_component_kinds: SupportedComponentKinds
interaction_model: EnumRendererInteractionModel1
accessibility_tier: EnumAccessibilityTier1
contract_version: ModelSemVer2
supports_interaction?: SupportsInteraction
supports_streaming?: SupportsStreaming
supports_theming?: SupportsTheming
}
/**
 * Semantic version model following SemVer 2.0.0 specification.
 * 
 * Full SemVer format: MAJOR.MINOR.PATCH[-prerelease][+build]
 * 
 * Preferred usage (structured format):
 *     >>> version = ModelSemVer(major=0, minor=4, patch=0)
 *     >>> assert str(version) == "0.4.0"
 *     >>> assert version.major == 0 and version.minor == 4
 * 
 * With prerelease and build metadata:
 *     >>> version = ModelSemVer(major=1, minor=0, patch=0, prerelease=("alpha", 1))
 *     >>> assert str(version) == "1.0.0-alpha.1"
 *     >>> assert version.is_prerelease() is True
 * 
 * For parsing external input, use the parse() class method:
 *     >>> version = ModelSemVer.parse("1.0.0-alpha.1+build.123")
 *     >>> assert version.prerelease == ("alpha", 1)
 *     >>> assert version.build == ("build", "123")
 * 
 * Precedence rules (per SemVer spec):
 *     - prerelease < no prerelease (1.0.0-alpha < 1.0.0)
 *     - Numeric identifiers < alphanumeric (1.0.0-1 < 1.0.0-alpha)
 *     - Build metadata is IGNORED for precedence
 * 
 * Note:
 *     String version literals like "1.0.0" are deprecated.
 *     Always use structured format: ModelSemVer(major=X, minor=Y, patch=Z)
 * 
 *     This model is frozen (immutable) and hashable, suitable for use as dict
 *     keys or in sets. Hash is based on major, minor, patch, and prerelease;
 *     build metadata is excluded (see __hash__ docstring for details).
 */
export interface ModelSemVer2 {
major: Major
minor: Minor
patch: Patch
prerelease?: Prerelease
build?: Build
}
/**
 * A versioned, platform-neutral design-token contract for renderers.
 * 
 * Every renderer that declares ``supports_theming=True`` in its
 * ``ModelRendererCapabilityContract`` must consume tokens from an instance
 * of this model — it must never hard-code token values.
 * 
 * ``contract_version`` is the authoritative version of this token set.
 * Consumers should carry the version forward into their generated output (e.g.
 * ``--theme-version: 1.0.0`` in CSS) so drift is always traceable.
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "ModelRendererThemeContract".
 */
export interface ModelRendererThemeContract {
theme_id: ThemeId
contract_version: ModelSemVer3
color_background_primary: ColorBackgroundPrimary
color_background_secondary: ColorBackgroundSecondary
color_background_elevated: ColorBackgroundElevated
color_text_primary: ColorTextPrimary
color_text_secondary: ColorTextSecondary
color_text_disabled: ColorTextDisabled
color_accent_primary: ColorAccentPrimary
color_accent_secondary: ColorAccentSecondary
color_status_success: ColorStatusSuccess
color_status_warning: ColorStatusWarning
color_status_error: ColorStatusError
color_status_info: ColorStatusInfo
color_border_default: ColorBorderDefault
color_border_strong: ColorBorderStrong
spacing_xs: SpacingXs
spacing_sm: SpacingSm
spacing_md: SpacingMd
spacing_lg: SpacingLg
spacing_xl: SpacingXl
font_family_base: FontFamilyBase
font_size_sm: FontSizeSm
font_size_md: FontSizeMd
font_size_lg: FontSizeLg
font_weight_normal: FontWeightNormal
font_weight_bold: FontWeightBold
border_radius_sm: BorderRadiusSm
border_radius_md: BorderRadiusMd
border_radius_lg: BorderRadiusLg
}
/**
 * Semantic version model following SemVer 2.0.0 specification.
 * 
 * Full SemVer format: MAJOR.MINOR.PATCH[-prerelease][+build]
 * 
 * Preferred usage (structured format):
 *     >>> version = ModelSemVer(major=0, minor=4, patch=0)
 *     >>> assert str(version) == "0.4.0"
 *     >>> assert version.major == 0 and version.minor == 4
 * 
 * With prerelease and build metadata:
 *     >>> version = ModelSemVer(major=1, minor=0, patch=0, prerelease=("alpha", 1))
 *     >>> assert str(version) == "1.0.0-alpha.1"
 *     >>> assert version.is_prerelease() is True
 * 
 * For parsing external input, use the parse() class method:
 *     >>> version = ModelSemVer.parse("1.0.0-alpha.1+build.123")
 *     >>> assert version.prerelease == ("alpha", 1)
 *     >>> assert version.build == ("build", "123")
 * 
 * Precedence rules (per SemVer spec):
 *     - prerelease < no prerelease (1.0.0-alpha < 1.0.0)
 *     - Numeric identifiers < alphanumeric (1.0.0-1 < 1.0.0-alpha)
 *     - Build metadata is IGNORED for precedence
 * 
 * Note:
 *     String version literals like "1.0.0" are deprecated.
 *     Always use structured format: ModelSemVer(major=X, minor=Y, patch=Z)
 * 
 *     This model is frozen (immutable) and hashable, suitable for use as dict
 *     keys or in sets. Hash is based on major, minor, patch, and prerelease;
 *     build metadata is excluded (see __hash__ docstring for details).
 */
export interface ModelSemVer3 {
major: Major
minor: Minor
patch: Patch
prerelease?: Prerelease
build?: Build
}
/**
 * A versioned, schema-validated set of design-token values.
 * 
 * The unit a surface activates and a catalog entry points at. Immutable:
 * a published revision is never edited in place, because rollback is only
 * meaningful if the bytes behind a revision cannot move.
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "ModelThemeInstance".
 */
export interface ModelThemeInstance {
theme_id: ThemeId1
schema_version: ModelSemVer4
instance_revision: ModelSemVer5
summary: Summary
tokens: ModelRendererThemeContract1
}
/**
 * Semantic version model following SemVer 2.0.0 specification.
 * 
 * Full SemVer format: MAJOR.MINOR.PATCH[-prerelease][+build]
 * 
 * Preferred usage (structured format):
 *     >>> version = ModelSemVer(major=0, minor=4, patch=0)
 *     >>> assert str(version) == "0.4.0"
 *     >>> assert version.major == 0 and version.minor == 4
 * 
 * With prerelease and build metadata:
 *     >>> version = ModelSemVer(major=1, minor=0, patch=0, prerelease=("alpha", 1))
 *     >>> assert str(version) == "1.0.0-alpha.1"
 *     >>> assert version.is_prerelease() is True
 * 
 * For parsing external input, use the parse() class method:
 *     >>> version = ModelSemVer.parse("1.0.0-alpha.1+build.123")
 *     >>> assert version.prerelease == ("alpha", 1)
 *     >>> assert version.build == ("build", "123")
 * 
 * Precedence rules (per SemVer spec):
 *     - prerelease < no prerelease (1.0.0-alpha < 1.0.0)
 *     - Numeric identifiers < alphanumeric (1.0.0-1 < 1.0.0-alpha)
 *     - Build metadata is IGNORED for precedence
 * 
 * Note:
 *     String version literals like "1.0.0" are deprecated.
 *     Always use structured format: ModelSemVer(major=X, minor=Y, patch=Z)
 * 
 *     This model is frozen (immutable) and hashable, suitable for use as dict
 *     keys or in sets. Hash is based on major, minor, patch, and prerelease;
 *     build metadata is excluded (see __hash__ docstring for details).
 */
export interface ModelSemVer4 {
major: Major
minor: Minor
patch: Patch
prerelease?: Prerelease
build?: Build
}
/**
 * Semantic version model following SemVer 2.0.0 specification.
 * 
 * Full SemVer format: MAJOR.MINOR.PATCH[-prerelease][+build]
 * 
 * Preferred usage (structured format):
 *     >>> version = ModelSemVer(major=0, minor=4, patch=0)
 *     >>> assert str(version) == "0.4.0"
 *     >>> assert version.major == 0 and version.minor == 4
 * 
 * With prerelease and build metadata:
 *     >>> version = ModelSemVer(major=1, minor=0, patch=0, prerelease=("alpha", 1))
 *     >>> assert str(version) == "1.0.0-alpha.1"
 *     >>> assert version.is_prerelease() is True
 * 
 * For parsing external input, use the parse() class method:
 *     >>> version = ModelSemVer.parse("1.0.0-alpha.1+build.123")
 *     >>> assert version.prerelease == ("alpha", 1)
 *     >>> assert version.build == ("build", "123")
 * 
 * Precedence rules (per SemVer spec):
 *     - prerelease < no prerelease (1.0.0-alpha < 1.0.0)
 *     - Numeric identifiers < alphanumeric (1.0.0-1 < 1.0.0-alpha)
 *     - Build metadata is IGNORED for precedence
 * 
 * Note:
 *     String version literals like "1.0.0" are deprecated.
 *     Always use structured format: ModelSemVer(major=X, minor=Y, patch=Z)
 * 
 *     This model is frozen (immutable) and hashable, suitable for use as dict
 *     keys or in sets. Hash is based on major, minor, patch, and prerelease;
 *     build metadata is excluded (see __hash__ docstring for details).
 */
export interface ModelSemVer5 {
major: Major
minor: Minor
patch: Patch
prerelease?: Prerelease
build?: Build
}
/**
 * The complete, schema-validated token value set
 */
export interface ModelRendererThemeContract1 {
theme_id: ThemeId
contract_version: ModelSemVer3
color_background_primary: ColorBackgroundPrimary
color_background_secondary: ColorBackgroundSecondary
color_background_elevated: ColorBackgroundElevated
color_text_primary: ColorTextPrimary
color_text_secondary: ColorTextSecondary
color_text_disabled: ColorTextDisabled
color_accent_primary: ColorAccentPrimary
color_accent_secondary: ColorAccentSecondary
color_status_success: ColorStatusSuccess
color_status_warning: ColorStatusWarning
color_status_error: ColorStatusError
color_status_info: ColorStatusInfo
color_border_default: ColorBorderDefault
color_border_strong: ColorBorderStrong
spacing_xs: SpacingXs
spacing_sm: SpacingSm
spacing_md: SpacingMd
spacing_lg: SpacingLg
spacing_xl: SpacingXl
font_family_base: FontFamilyBase
font_size_sm: FontSizeSm
font_size_md: FontSizeMd
font_size_lg: FontSizeLg
font_weight_normal: FontWeightNormal
font_weight_bold: FontWeightBold
border_radius_sm: BorderRadiusSm
border_radius_md: BorderRadiusMd
border_radius_lg: BorderRadiusLg
}
/**
 * One immutable, digested theme revision in the catalog.
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "ModelThemeCatalogEntry".
 */
export interface ModelThemeCatalogEntry {
theme_id: ThemeId2
schema_version: ModelSemVer6
instance_revision: ModelSemVer7
content_digest: ContentDigest
source_path: SourcePath
}
/**
 * Semantic version model following SemVer 2.0.0 specification.
 * 
 * Full SemVer format: MAJOR.MINOR.PATCH[-prerelease][+build]
 * 
 * Preferred usage (structured format):
 *     >>> version = ModelSemVer(major=0, minor=4, patch=0)
 *     >>> assert str(version) == "0.4.0"
 *     >>> assert version.major == 0 and version.minor == 4
 * 
 * With prerelease and build metadata:
 *     >>> version = ModelSemVer(major=1, minor=0, patch=0, prerelease=("alpha", 1))
 *     >>> assert str(version) == "1.0.0-alpha.1"
 *     >>> assert version.is_prerelease() is True
 * 
 * For parsing external input, use the parse() class method:
 *     >>> version = ModelSemVer.parse("1.0.0-alpha.1+build.123")
 *     >>> assert version.prerelease == ("alpha", 1)
 *     >>> assert version.build == ("build", "123")
 * 
 * Precedence rules (per SemVer spec):
 *     - prerelease < no prerelease (1.0.0-alpha < 1.0.0)
 *     - Numeric identifiers < alphanumeric (1.0.0-1 < 1.0.0-alpha)
 *     - Build metadata is IGNORED for precedence
 * 
 * Note:
 *     String version literals like "1.0.0" are deprecated.
 *     Always use structured format: ModelSemVer(major=X, minor=Y, patch=Z)
 * 
 *     This model is frozen (immutable) and hashable, suitable for use as dict
 *     keys or in sets. Hash is based on major, minor, patch, and prerelease;
 *     build metadata is excluded (see __hash__ docstring for details).
 */
export interface ModelSemVer6 {
major: Major
minor: Minor
patch: Patch
prerelease?: Prerelease
build?: Build
}
/**
 * Semantic version model following SemVer 2.0.0 specification.
 * 
 * Full SemVer format: MAJOR.MINOR.PATCH[-prerelease][+build]
 * 
 * Preferred usage (structured format):
 *     >>> version = ModelSemVer(major=0, minor=4, patch=0)
 *     >>> assert str(version) == "0.4.0"
 *     >>> assert version.major == 0 and version.minor == 4
 * 
 * With prerelease and build metadata:
 *     >>> version = ModelSemVer(major=1, minor=0, patch=0, prerelease=("alpha", 1))
 *     >>> assert str(version) == "1.0.0-alpha.1"
 *     >>> assert version.is_prerelease() is True
 * 
 * For parsing external input, use the parse() class method:
 *     >>> version = ModelSemVer.parse("1.0.0-alpha.1+build.123")
 *     >>> assert version.prerelease == ("alpha", 1)
 *     >>> assert version.build == ("build", "123")
 * 
 * Precedence rules (per SemVer spec):
 *     - prerelease < no prerelease (1.0.0-alpha < 1.0.0)
 *     - Numeric identifiers < alphanumeric (1.0.0-1 < 1.0.0-alpha)
 *     - Build metadata is IGNORED for precedence
 * 
 * Note:
 *     String version literals like "1.0.0" are deprecated.
 *     Always use structured format: ModelSemVer(major=X, minor=Y, patch=Z)
 * 
 *     This model is frozen (immutable) and hashable, suitable for use as dict
 *     keys or in sets. Hash is based on major, minor, patch, and prerelease;
 *     build metadata is excluded (see __hash__ docstring for details).
 */
export interface ModelSemVer7 {
major: Major
minor: Minor
patch: Patch
prerelease?: Prerelease
build?: Build
}
/**
 * Every published theme revision, indexed by (theme_id, instance_revision).
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "ModelThemeCatalog".
 */
export interface ModelThemeCatalog {
catalog_version: ModelSemVer8
entries: Entries
}
/**
 * Semantic version model following SemVer 2.0.0 specification.
 * 
 * Full SemVer format: MAJOR.MINOR.PATCH[-prerelease][+build]
 * 
 * Preferred usage (structured format):
 *     >>> version = ModelSemVer(major=0, minor=4, patch=0)
 *     >>> assert str(version) == "0.4.0"
 *     >>> assert version.major == 0 and version.minor == 4
 * 
 * With prerelease and build metadata:
 *     >>> version = ModelSemVer(major=1, minor=0, patch=0, prerelease=("alpha", 1))
 *     >>> assert str(version) == "1.0.0-alpha.1"
 *     >>> assert version.is_prerelease() is True
 * 
 * For parsing external input, use the parse() class method:
 *     >>> version = ModelSemVer.parse("1.0.0-alpha.1+build.123")
 *     >>> assert version.prerelease == ("alpha", 1)
 *     >>> assert version.build == ("build", "123")
 * 
 * Precedence rules (per SemVer spec):
 *     - prerelease < no prerelease (1.0.0-alpha < 1.0.0)
 *     - Numeric identifiers < alphanumeric (1.0.0-1 < 1.0.0-alpha)
 *     - Build metadata is IGNORED for precedence
 * 
 * Note:
 *     String version literals like "1.0.0" are deprecated.
 *     Always use structured format: ModelSemVer(major=X, minor=Y, patch=Z)
 * 
 *     This model is frozen (immutable) and hashable, suitable for use as dict
 *     keys or in sets. Hash is based on major, minor, patch, and prerelease;
 *     build metadata is excluded (see __hash__ docstring for details).
 */
export interface ModelSemVer8 {
major: Major
minor: Minor
patch: Patch
prerelease?: Prerelease
build?: Build
}
/**
 * Which published theme revision a surface is currently rendering.
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "ModelThemeActivation".
 */
export interface ModelThemeActivation {
surface_id: SurfaceId
theme_id: ThemeId3
instance_revision: ModelSemVer9
content_digest: ContentDigest1
activation_sequence: ActivationSequence
/**
 * Revision this activation replaced, and therefore the revision a rollback returns to. None on a surface's first activation.
 */
superseded_revision?: (ModelSemVer | null)
}
/**
 * Semantic version model following SemVer 2.0.0 specification.
 * 
 * Full SemVer format: MAJOR.MINOR.PATCH[-prerelease][+build]
 * 
 * Preferred usage (structured format):
 *     >>> version = ModelSemVer(major=0, minor=4, patch=0)
 *     >>> assert str(version) == "0.4.0"
 *     >>> assert version.major == 0 and version.minor == 4
 * 
 * With prerelease and build metadata:
 *     >>> version = ModelSemVer(major=1, minor=0, patch=0, prerelease=("alpha", 1))
 *     >>> assert str(version) == "1.0.0-alpha.1"
 *     >>> assert version.is_prerelease() is True
 * 
 * For parsing external input, use the parse() class method:
 *     >>> version = ModelSemVer.parse("1.0.0-alpha.1+build.123")
 *     >>> assert version.prerelease == ("alpha", 1)
 *     >>> assert version.build == ("build", "123")
 * 
 * Precedence rules (per SemVer spec):
 *     - prerelease < no prerelease (1.0.0-alpha < 1.0.0)
 *     - Numeric identifiers < alphanumeric (1.0.0-1 < 1.0.0-alpha)
 *     - Build metadata is IGNORED for precedence
 * 
 * Note:
 *     String version literals like "1.0.0" are deprecated.
 *     Always use structured format: ModelSemVer(major=X, minor=Y, patch=Z)
 * 
 *     This model is frozen (immutable) and hashable, suitable for use as dict
 *     keys or in sets. Hash is based on major, minor, patch, and prerelease;
 *     build metadata is excluded (see __hash__ docstring for details).
 */
export interface ModelSemVer9 {
major: Major
minor: Minor
patch: Patch
prerelease?: Prerelease
build?: Build
}
/**
 * Configuration for a chart axis in dashboard visualizations.
 * 
 * Defines display properties for X or Y axes in chart widgets,
 * including labels, value ranges, and grid visibility.
 * 
 * Used by chart-based dashboard widgets to configure axis rendering.
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "ModelChartAxisConfig".
 */
export interface ModelChartAxisConfig {
label?: Label2
min_value?: MinValue
max_value?: MaxValue
show_grid?: ShowGrid
}
/**
 * Configuration for a single data series in dashboard charts.
 * 
 * Defines how a dataset should be rendered within a chart widget,
 * including the data source key, visual styling, and chart type.
 * 
 * Multiple series configs can be combined to create multi-series
 * charts with different visualization styles (line, bar, area, scatter).
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "ModelChartSeriesConfig".
 */
export interface ModelChartSeriesConfig {
name: Name4
data_key: DataKey
color?: Color
series_type?: SeriesType
}
/**
 * Filter configuration for event feed widgets.
 * 
 * Defines criteria for filtering which events appear in an event feed.
 * All filter criteria use allowlist semantics - only events matching
 * the specified values are included. Empty tuples mean "include all".
 * 
 * Multiple filter criteria are combined with AND logic - an event must
 * match all non-empty filter criteria to be displayed.
 * 
 * Attributes:
 *     event_types: Tuple of event type strings to include. An empty tuple
 *         means all event types are included. Example: ("error", "warning").
 *     severity_levels: Tuple of severity levels to include. An empty tuple
 *         means all severity levels are included. Example: ("critical", "error").
 *     sources: Tuple of event source identifiers to include. An empty tuple
 *         means all sources are included. Example: ("api", "worker", "scheduler").
 * 
 * Example:
 *     Filter to show only error events::
 * 
 *         filter = ModelEventFilter(
 *             event_types=("error",),
 *         )
 * 
 *     No filtering (show all events)::
 * 
 *         filter = ModelEventFilter()  # All tuples default to empty
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "ModelEventFilter".
 */
export interface ModelEventFilter {
event_types?: EventTypes
severity_levels?: SeverityLevels
sources?: Sources
}
/**
 * Threshold configuration for conditional metric coloring.
 * 
 * Defines a value threshold that triggers a color change in metric card
 * widgets. Multiple thresholds can be configured to create a color scale
 * (e.g., green -> yellow -> red) based on the metric value.
 * 
 * Thresholds are typically evaluated in ascending order by value. When
 * the metric exceeds a threshold value, that threshold's color is applied.
 * 
 * Attributes:
 *     value: The numeric threshold value. When the metric reaches or
 *         exceeds this value, the associated color is applied.
 *     color: Hex color code to apply when threshold is reached. Must be
 *         a valid hex format (#RGB, #RRGGBB, #RGBA, or #RRGGBBAA).
 *     label: Optional human-readable label for the threshold level
 *         (e.g., "Good", "Warning", "Critical").
 * 
 * Raises:
 *     ValueError: If color is not a valid hex color format.
 * 
 * Example:
 *     Single warning threshold::
 * 
 *         threshold = ModelMetricThreshold(
 *             value=80.0,
 *             color="#eab308",
 *             label="High Usage",
 *         )
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "ModelMetricThreshold".
 */
export interface ModelMetricThreshold {
value: Value
color: Color1
label?: Label3
}
/**
 * Presentation of one severity: theme token, text label, icon.
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "ModelSeverityRole".
 */
export interface ModelSeverityRole {
severity: EnumStatusSeverity1
theme_color_token: ThemeColorToken
label: Label4
icon: Icon
}
/**
 * An upstream severity decision, traceable to the policy that made it.
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "ModelSeverityVerdict".
 */
export interface ModelSeverityVerdict {
severity: EnumStatusSeverity2
status_value: StatusValue
policy_id: PolicyId
policy_version: ModelSemVer10
policy_digest: PolicyDigest
}
/**
 * Semantic version model following SemVer 2.0.0 specification.
 * 
 * Full SemVer format: MAJOR.MINOR.PATCH[-prerelease][+build]
 * 
 * Preferred usage (structured format):
 *     >>> version = ModelSemVer(major=0, minor=4, patch=0)
 *     >>> assert str(version) == "0.4.0"
 *     >>> assert version.major == 0 and version.minor == 4
 * 
 * With prerelease and build metadata:
 *     >>> version = ModelSemVer(major=1, minor=0, patch=0, prerelease=("alpha", 1))
 *     >>> assert str(version) == "1.0.0-alpha.1"
 *     >>> assert version.is_prerelease() is True
 * 
 * For parsing external input, use the parse() class method:
 *     >>> version = ModelSemVer.parse("1.0.0-alpha.1+build.123")
 *     >>> assert version.prerelease == ("alpha", 1)
 *     >>> assert version.build == ("build", "123")
 * 
 * Precedence rules (per SemVer spec):
 *     - prerelease < no prerelease (1.0.0-alpha < 1.0.0)
 *     - Numeric identifiers < alphanumeric (1.0.0-1 < 1.0.0-alpha)
 *     - Build metadata is IGNORED for precedence
 * 
 * Note:
 *     String version literals like "1.0.0" are deprecated.
 *     Always use structured format: ModelSemVer(major=X, minor=Y, patch=Z)
 * 
 *     This model is frozen (immutable) and hashable, suitable for use as dict
 *     keys or in sets. Hash is based on major, minor, patch, and prerelease;
 *     build metadata is excluded (see __hash__ docstring for details).
 */
export interface ModelSemVer10 {
major: Major
minor: Minor
patch: Patch
prerelease?: Prerelease
build?: Build
}
/**
 * One tile: what it names, what upstream says about it, and its number.
 * 
 * ``verdict`` is required. A tile that cannot say what it is reporting is a
 * label, not a status indicator, and the board exists to show what is broken.
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "ModelStatusItemConfig".
 */
export interface ModelStatusItemConfig {
key: Key1
label: Label5
icon?: Icon1
verdict: ModelSeverityVerdict1
/**
 * Numeric secondary displayed alongside the status (count, depth, rate). None where the tile's truth is the verdict alone.
 */
secondary?: (ModelStatusSecondary | null)
}
/**
 * Upstream severity verdict for this tile, with the policy that produced it. Computed upstream; never inferred by the client.
 */
export interface ModelSeverityVerdict1 {
severity: EnumStatusSeverity2
status_value: StatusValue
policy_id: PolicyId
policy_version: ModelSemVer10
policy_digest: PolicyDigest
}
/**
 * A numeric secondary displayed alongside a tile's status.
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "ModelStatusSecondary".
 */
export interface ModelStatusSecondary {
kind: EnumStatusSecondaryKind1
value: Value1
label: Label6
unit?: Unit1
}
/**
 * Configuration for a single column in dashboard table widgets.
 * 
 * Defines column display properties including header text, width,
 * sorting behavior, alignment, and value formatting.
 * 
 * Used by table-based dashboard widgets to configure column rendering
 * and user interaction capabilities.
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "ModelTableColumnConfig".
 */
export interface ModelTableColumnConfig {
key: Key2
header: Header
width?: Width
sortable?: Sortable
align?: Align
format?: Format
}
/**
 * Configuration for chart-type dashboard widgets.
 * 
 * Defines how a chart widget renders data with one or more series and
 * optional axis configurations. Supports multiple chart types including
 * line graphs, bar charts, area charts, pie charts, and scatter plots.
 * 
 * Data-driven chart types (line, bar, area, scatter) require at least one
 * series configuration. Pie charts derive their segments from the data
 * directly without explicit series configuration.
 * 
 * Attributes:
 *     config_kind: Literal discriminator value, always "chart".
 *     widget_type: Widget type enum, always CHART.
 *     chart_type: The visualization style - line, bar, area, pie, or scatter.
 *     series: Tuple of series configurations defining each data line/bar.
 *         Required for line, bar, area, and scatter charts.
 *     x_axis: Optional X-axis configuration for labels and ranges.
 *     y_axis: Optional Y-axis configuration for labels and ranges.
 *     show_legend: Whether to display the legend identifying series.
 *     stacked: Whether to stack series values (for bar/area charts).
 * 
 * Raises:
 *     ValueError: If a data-driven chart type has no series configured.
 * 
 * Example:
 *     Stacked bar chart::
 * 
 *         config = ModelWidgetConfigChart(
 *             chart_type="bar",
 *             series=(series1, series2),
 *             stacked=True,
 *         )
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "ModelWidgetConfigChart".
 */
export interface ModelWidgetConfigChart {
config_kind?: ConfigKind
widget_type?: EnumWidgetType2
chart_type?: ChartType
series?: Series
/**
 * X-axis configuration
 */
x_axis?: (ModelChartAxisConfig | null)
/**
 * Y-axis configuration
 */
y_axis?: (ModelChartAxisConfig | null)
show_legend?: ShowLegend
stacked?: Stacked
}
/**
 * Configuration for event feed dashboard widgets.
 * 
 * Displays a scrolling feed of events in real-time, with optional filtering
 * by event type, severity, and source. Events can be displayed with
 * timestamps, source information, and severity indicators.
 * 
 * The ``event_filter`` field uses the alias "filter" for JSON serialization
 * to match frontend conventions while avoiding Python keyword conflicts.
 * 
 * Attributes:
 *     config_kind: Literal discriminator value, always "event_feed".
 *     widget_type: Widget type enum, always EVENT_FEED.
 *     max_items: Maximum number of events to display in the feed (1-500).
 *         Older events are removed when this limit is exceeded.
 *     event_filter: Optional filter configuration to limit which events
 *         are displayed. Serialized as "filter" in JSON.
 *     show_timestamp: Whether to display event timestamps.
 *     show_source: Whether to display the event source/origin.
 *     show_severity: Whether to show severity level indicator.
 *     group_by_type: Whether to group events by their type.
 *     auto_scroll: Whether to automatically scroll to show new events.
 * 
 * Example:
 *     Minimal event feed showing all events::
 * 
 *         config = ModelWidgetConfigEventFeed(max_items=25)
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "ModelWidgetConfigEventFeed".
 */
export interface ModelWidgetConfigEventFeed {
config_kind?: ConfigKind1
widget_type?: EnumWidgetType3
max_items?: MaxItems
/**
 * Event filtering configuration
 */
filter?: (ModelEventFilter | null)
show_timestamp?: ShowTimestamp
show_source?: ShowSource
show_severity?: ShowSeverity
group_by_type?: GroupByType
auto_scroll?: AutoScroll
}
/**
 * Configuration for metric card dashboard widgets.
 * 
 * Displays a single metric value prominently with optional formatting,
 * trend indicator, color thresholds, and icon. Metric cards are ideal
 * for highlighting KPIs like counts, percentages, or durations.
 * 
 * The threshold system allows dynamic coloring based on the metric value,
 * with thresholds checked in order (first matching threshold wins).
 * 
 * Attributes:
 *     config_kind: Literal discriminator value, always "metric_card".
 *     widget_type: Widget type enum, always METRIC_CARD.
 *     metric_key: Data key to extract the metric value from the data source.
 *     label: Human-readable label displayed above/below the value.
 *     unit: Unit of measurement displayed after the value (e.g., "%", "ms").
 *     value_format: Value formatting mode - number, currency, percent, or duration.
 *         Aliased as "format" in JSON for API compatibility.
 *     precision: Decimal places to show (0-10).
 *     show_trend: Whether to show up/down trend indicator.
 *     trend_key: Data key for the comparison value when show_trend is True.
 *     thresholds: Tuple of threshold configs for conditional coloring.
 *     icon: Optional icon identifier to display with the metric.
 * 
 * Raises:
 *     ValueError: If show_trend is True but trend_key is not provided.
 * 
 * Example:
 *     Simple count metric::
 * 
 *         config = ModelWidgetConfigMetricCard(
 *             metric_key="active_users",
 *             label="Active Users",
 *             value_format="number",
 *             precision=0,
 *         )
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "ModelWidgetConfigMetricCard".
 */
export interface ModelWidgetConfigMetricCard {
config_kind?: ConfigKind2
widget_type?: EnumWidgetType4
metric_key: MetricKey
label: Label7
unit?: Unit2
format?: Format1
precision?: Precision
show_trend?: ShowTrend
trend_key?: TrendKey
thresholds?: Thresholds
icon?: Icon2
}
/**
 * Configuration for status grid dashboard widgets.
 * 
 * Displays a grid of status indicators for monitoring the health of multiple
 * systems, services, or components. Each tile carries an upstream verdict; the
 * grid maps that verdict to presentation and never computes one.
 * 
 * Attributes:
 *     config_kind: Literal discriminator value, always "status_grid".
 *     widget_type: Widget type enum, always STATUS_GRID.
 *     items: Tiles to display.
 *     columns: Number of columns in the grid layout (1-12).
 *     show_labels: Whether to display the tile's own text label.
 *     compact: Whether to use compact mode with smaller indicators.
 *     severity_roles: How each severity renders — theme token name, text
 *         label, icon. Every severity must be covered exactly once, with a
 *         distinct label and a distinct icon.
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "ModelWidgetConfigStatusGrid".
 */
export interface ModelWidgetConfigStatusGrid {
config_kind?: ConfigKind3
widget_type?: EnumWidgetType5
items?: Items
columns?: Columns3
show_labels?: ShowLabels
compact?: Compact
severity_roles?: SeverityRoles
}
/**
 * Configuration for table-type dashboard widgets.
 * 
 * Defines how a table widget displays tabular data with configurable
 * columns, pagination, sorting, and visual styling options. Tables
 * support client-side sorting and pagination with customizable page sizes.
 * 
 * Attributes:
 *     config_kind: Literal discriminator value, always "table".
 *     widget_type: Widget type enum, always TABLE.
 *     columns: Tuple of column configurations defining table structure.
 *     page_size: Number of rows displayed per page (1-100).
 *     show_pagination: Whether to show pagination controls.
 *     default_sort_key: Column key to sort by initially, or None.
 *     default_sort_direction: Sort direction ("asc" or "desc"). Only valid
 *         when default_sort_key is set.
 *     striped: Whether to alternate row background colors.
 *     hover_highlight: Whether to highlight rows on mouse hover.
 * 
 * Raises:
 *     ValueError: If default_sort_direction is set without default_sort_key.
 * 
 * Example:
 *     Compact table without pagination::
 * 
 *         config = ModelWidgetConfigTable(
 *             columns=(col1, col2),
 *             page_size=100,
 *             show_pagination=False,
 *             striped=False,
 *         )
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "ModelWidgetConfigTable".
 */
export interface ModelWidgetConfigTable {
config_kind?: ConfigKind4
widget_type?: EnumWidgetType6
columns?: Columns4
page_size?: PageSize
show_pagination?: ShowPagination
default_sort_key?: DefaultSortKey
default_sort_direction?: DefaultSortDirection
striped?: Striped
hover_highlight?: HoverHighlight
}
/**
 * Publishing origin of a widget envelope.
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "ModelWidgetProvenance".
 */
export interface ModelWidgetProvenance {
pack_namespace: PackNamespace
pack_name: PackName
pack_version: ModelSemVer11
source_revision: SourceRevision
}
/**
 * Semantic version model following SemVer 2.0.0 specification.
 * 
 * Full SemVer format: MAJOR.MINOR.PATCH[-prerelease][+build]
 * 
 * Preferred usage (structured format):
 *     >>> version = ModelSemVer(major=0, minor=4, patch=0)
 *     >>> assert str(version) == "0.4.0"
 *     >>> assert version.major == 0 and version.minor == 4
 * 
 * With prerelease and build metadata:
 *     >>> version = ModelSemVer(major=1, minor=0, patch=0, prerelease=("alpha", 1))
 *     >>> assert str(version) == "1.0.0-alpha.1"
 *     >>> assert version.is_prerelease() is True
 * 
 * For parsing external input, use the parse() class method:
 *     >>> version = ModelSemVer.parse("1.0.0-alpha.1+build.123")
 *     >>> assert version.prerelease == ("alpha", 1)
 *     >>> assert version.build == ("build", "123")
 * 
 * Precedence rules (per SemVer spec):
 *     - prerelease < no prerelease (1.0.0-alpha < 1.0.0)
 *     - Numeric identifiers < alphanumeric (1.0.0-1 < 1.0.0-alpha)
 *     - Build metadata is IGNORED for precedence
 * 
 * Note:
 *     String version literals like "1.0.0" are deprecated.
 *     Always use structured format: ModelSemVer(major=X, minor=Y, patch=Z)
 * 
 *     This model is frozen (immutable) and hashable, suitable for use as dict
 *     keys or in sets. Hash is based on major, minor, patch, and prerelease;
 *     build metadata is excluded (see __hash__ docstring for details).
 */
export interface ModelSemVer11 {
major: Major
minor: Minor
patch: Patch
prerelease?: Prerelease
build?: Build
}
/**
 * A complete, versioned, sealed widget contract.
 * 
 * Three versions live here and they answer different questions:
 * ``envelope_version`` is the version of *this format*, ``widget_version`` is
 * the version of *this widget as published*, and
 * ``component.contract_version`` is the version of the *component contract*
 * the widget binds. A consumer that must reject an envelope it cannot parse
 * reads the first; a consumer choosing between two published widgets reads the
 * second; a renderer deciding whether it can render at all reads the third.
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "ModelWidgetEnvelope".
 */
export interface ModelWidgetEnvelope {
envelope_version: ModelSemVer12
widget_id: WidgetId
widget_version: ModelSemVer13
component: ModelComponentContract1
config: Config
provenance: ModelWidgetProvenance1
content_digest: ContentDigest2
}
/**
 * Semantic version model following SemVer 2.0.0 specification.
 * 
 * Full SemVer format: MAJOR.MINOR.PATCH[-prerelease][+build]
 * 
 * Preferred usage (structured format):
 *     >>> version = ModelSemVer(major=0, minor=4, patch=0)
 *     >>> assert str(version) == "0.4.0"
 *     >>> assert version.major == 0 and version.minor == 4
 * 
 * With prerelease and build metadata:
 *     >>> version = ModelSemVer(major=1, minor=0, patch=0, prerelease=("alpha", 1))
 *     >>> assert str(version) == "1.0.0-alpha.1"
 *     >>> assert version.is_prerelease() is True
 * 
 * For parsing external input, use the parse() class method:
 *     >>> version = ModelSemVer.parse("1.0.0-alpha.1+build.123")
 *     >>> assert version.prerelease == ("alpha", 1)
 *     >>> assert version.build == ("build", "123")
 * 
 * Precedence rules (per SemVer spec):
 *     - prerelease < no prerelease (1.0.0-alpha < 1.0.0)
 *     - Numeric identifiers < alphanumeric (1.0.0-1 < 1.0.0-alpha)
 *     - Build metadata is IGNORED for precedence
 * 
 * Note:
 *     String version literals like "1.0.0" are deprecated.
 *     Always use structured format: ModelSemVer(major=X, minor=Y, patch=Z)
 * 
 *     This model is frozen (immutable) and hashable, suitable for use as dict
 *     keys or in sets. Hash is based on major, minor, patch, and prerelease;
 *     build metadata is excluded (see __hash__ docstring for details).
 */
export interface ModelSemVer12 {
major: Major
minor: Minor
patch: Patch
prerelease?: Prerelease
build?: Build
}
/**
 * Semantic version model following SemVer 2.0.0 specification.
 * 
 * Full SemVer format: MAJOR.MINOR.PATCH[-prerelease][+build]
 * 
 * Preferred usage (structured format):
 *     >>> version = ModelSemVer(major=0, minor=4, patch=0)
 *     >>> assert str(version) == "0.4.0"
 *     >>> assert version.major == 0 and version.minor == 4
 * 
 * With prerelease and build metadata:
 *     >>> version = ModelSemVer(major=1, minor=0, patch=0, prerelease=("alpha", 1))
 *     >>> assert str(version) == "1.0.0-alpha.1"
 *     >>> assert version.is_prerelease() is True
 * 
 * For parsing external input, use the parse() class method:
 *     >>> version = ModelSemVer.parse("1.0.0-alpha.1+build.123")
 *     >>> assert version.prerelease == ("alpha", 1)
 *     >>> assert version.build == ("build", "123")
 * 
 * Precedence rules (per SemVer spec):
 *     - prerelease < no prerelease (1.0.0-alpha < 1.0.0)
 *     - Numeric identifiers < alphanumeric (1.0.0-1 < 1.0.0-alpha)
 *     - Build metadata is IGNORED for precedence
 * 
 * Note:
 *     String version literals like "1.0.0" are deprecated.
 *     Always use structured format: ModelSemVer(major=X, minor=Y, patch=Z)
 * 
 *     This model is frozen (immutable) and hashable, suitable for use as dict
 *     keys or in sets. Hash is based on major, minor, patch, and prerelease;
 *     build metadata is excluded (see __hash__ docstring for details).
 */
export interface ModelSemVer13 {
major: Major
minor: Minor
patch: Patch
prerelease?: Prerelease
build?: Build
}
/**
 * Component contract half: identity, kind, bindings, actions, permission, evidence requirements, empty-state reasons
 */
export interface ModelComponentContract1 {
component_id: ComponentId
component_kind: EnumWidgetType1
title: Title
contract_version: ModelSemVer1
data_bindings?: DataBindings
actions?: Actions
evidence_requirements?: EvidenceRequirements
/**
 * Permission contract gating who may see/act; None means unrestricted
 */
permission?: (ModelPermissionContract | null)
supported_empty_state_reasons?: SupportedEmptyStateReasons
}
/**
 * Which pack published this widget, at which source revision
 */
export interface ModelWidgetProvenance1 {
pack_namespace: PackNamespace
pack_name: PackName
pack_version: ModelSemVer11
source_revision: SourceRevision
}
/**
 * Outcome of verifying a single evidence check's receipt.
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "ModelReceiptCheckResult".
 */
export interface ModelReceiptCheckResult {
ticket_id: TicketId
evidence_item_id: EvidenceItemId
check_type: CheckType
passed: Passed
reason: Reason
}
/**
 * Aggregate outcome of the receipt-gate on a PR.
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "ModelReceiptGateResult".
 */
export interface ModelReceiptGateResult {
passed: Passed1
skipped?: Skipped
friction_logged?: FrictionLogged
message?: Message
checks?: Checks
tickets_checked?: TicketsChecked
}
/**
 * A deterministic, content-addressed packet for a contract-driven review.
 * 
 * ``source_contract_hash``, ``ir_hash``, and ``patch_hash`` are each a
 * ``sha256:<64 lowercase hex>`` reference to the source contract, the derived
 * intermediate representation, and the produced patch respectively.
 * ``validation_pipeline_version`` is the semantic version of the pipeline that
 * produced the packet. ``receipt_gate_result`` is the typed receipt-gate
 * outcome for the change. ``compute_packet_hash`` yields a stable hash over the
 * canonical serialization so equal packets hash equally.
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "ModelReviewPacket".
 */
export interface ModelReviewPacket {
source_contract_hash: SourceContractHash
ir_hash: IrHash
patch_hash: PatchHash
validation_pipeline_version: ModelSemVer14
receipt_gate_result: ModelReceiptGateResult1
}
/**
 * Semantic version model following SemVer 2.0.0 specification.
 * 
 * Full SemVer format: MAJOR.MINOR.PATCH[-prerelease][+build]
 * 
 * Preferred usage (structured format):
 *     >>> version = ModelSemVer(major=0, minor=4, patch=0)
 *     >>> assert str(version) == "0.4.0"
 *     >>> assert version.major == 0 and version.minor == 4
 * 
 * With prerelease and build metadata:
 *     >>> version = ModelSemVer(major=1, minor=0, patch=0, prerelease=("alpha", 1))
 *     >>> assert str(version) == "1.0.0-alpha.1"
 *     >>> assert version.is_prerelease() is True
 * 
 * For parsing external input, use the parse() class method:
 *     >>> version = ModelSemVer.parse("1.0.0-alpha.1+build.123")
 *     >>> assert version.prerelease == ("alpha", 1)
 *     >>> assert version.build == ("build", "123")
 * 
 * Precedence rules (per SemVer spec):
 *     - prerelease < no prerelease (1.0.0-alpha < 1.0.0)
 *     - Numeric identifiers < alphanumeric (1.0.0-1 < 1.0.0-alpha)
 *     - Build metadata is IGNORED for precedence
 * 
 * Note:
 *     String version literals like "1.0.0" are deprecated.
 *     Always use structured format: ModelSemVer(major=X, minor=Y, patch=Z)
 * 
 *     This model is frozen (immutable) and hashable, suitable for use as dict
 *     keys or in sets. Hash is based on major, minor, patch, and prerelease;
 *     build metadata is excluded (see __hash__ docstring for details).
 */
export interface ModelSemVer14 {
major: Major
minor: Minor
patch: Patch
prerelease?: Prerelease
build?: Build
}
/**
 * Typed receipt-gate outcome for the reviewed change
 */
export interface ModelReceiptGateResult1 {
passed: Passed1
skipped?: Skipped
friction_logged?: FrictionLogged
message?: Message
checks?: Checks
tickets_checked?: TicketsChecked
}
/**
 * A deterministic, order-independent bundle of review packets.
 * 
 * ``session_id`` is the stable semantic identifier for the OmniStudio session
 * that produced the bundle. ``packets`` is the immutable tuple of review
 * packets gathered during the session. ``compute_bundle_fingerprint`` hashes
 * the sorted per-packet hashes so bundle equality does not depend on packet
 * ordering.
 * 
 * This interface was referenced by `HttpsOmninodeAiSchemasOmnidashV2Json`'s JSON-Schema
 * via the `definition` "ModelOmniStudioEvidenceBundle".
 */
export interface ModelOmniStudioEvidenceBundle {
session_id: SessionId
packets?: Packets
}
