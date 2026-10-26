# Kinevor.Modules.Members.EntityFrameworkCore

EF Core persistence for the Kinevor members module.

## Install

```powershell
dotnet add package Kinevor.Modules.Members.EntityFrameworkCore --version 0.1.0
```

## What it provides

- `MembersDbContext` with members, progress, consents and devices.
- Unique member-number, e-mail, consent-key and device-token indexes.
- `IMemberRepository`, `IMemberEngagementRepository` and `IMembersUnitOfWork`.

Register the context with your provider, then call `AddMembersEntityFrameworkCore()`.
