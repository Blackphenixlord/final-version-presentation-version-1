# CTB, Blob, and Item Process Map

This map explains how units move through the system and how entity relationships work.

## Entity Meaning

- `Item`: A physical supply unit (tool, med kit, food pack, etc.).
- `Blob`: A tracked grouping/container context used for scan and slot logic.
- `CTB`: Cargo Transfer Bag used for operational packing/stow/move.

## Core Relationship Model

- Items are the base units being counted, tagged, moved, and consumed.
- Blobs represent grouped tracking state that can reference one or more items.
- CTBs are operational containers that hold items (or nested containers) for transport/stow.

## Process Flow Diagram

```mermaid
flowchart TD
    A[Vendor / Source] --> B[Receive]
    B --> C[Count + Verify]
    C --> D[Tag / Identify Item]

    D --> E[Create or Link Blob]
    E --> F[Assign Item to Blob Context]

    F --> G[Pack Item into CTB]
    G --> H[Stow CTB to Shelf/Slot]
    H --> I[Move CTB or Item as Needed]

    I --> J[Crew Use / Request / Return]
    J --> K{Item Consumed?}
    K -- No --> L[Repack or Restow]
    K -- Yes --> M[Dispose / Trash Workflow]

    L --> I
    M --> N[Archive Event History]
```

## Relationship Diagram

```mermaid
erDiagram
    ITEM ||--o{ BLOB_LINK : tracked_by
    BLOB ||--o{ BLOB_LINK : groups
    CTB ||--o{ CONTAINMENT : contains
    ITEM ||--o{ CONTAINMENT : packed_as_unit

    ITEM {
      string item_id
      string sku
      string status
      string location
    }

    BLOB {
      string blob_id
      string rfid
      int slot_count
      string status
    }

    CTB {
      string ctb_id
      string code
      int capacity
      string location
    }

    BLOB_LINK {
      string blob_id
      string item_id
      datetime linked_at
    }

    CONTAINMENT {
      string ctb_id
      string unit_id
      datetime packed_at
    }
```
