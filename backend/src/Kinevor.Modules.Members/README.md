# Kinevor.Modules.Members

Member management module for the Kinevor gym platform.

## Install

```powershell
dotnet add package Kinevor.Modules.Members --version 0.1.0
```

## What it provides

- `Member` aggregate with profile, health, address, emergency contact and freeze state.
- Staff member list, detail, registration, update, freeze and unfreeze.
- Member self-service profile, progress, consents, devices and privacy export/erasure.
- MediatR handlers and controllers under `api/v1/members` and `api/v1/me`.

Register the module with `AddMembersModule()` and implement `ICurrentUser` so
`api/v1/me` can resolve the linked member id.
