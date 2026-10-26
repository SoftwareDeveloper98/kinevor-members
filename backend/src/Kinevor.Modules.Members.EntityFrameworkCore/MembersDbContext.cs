using Kinevor.Modules.Members.Application;
using Kinevor.Modules.Members.Domain;
using Microsoft.EntityFrameworkCore;

namespace Kinevor.Modules.Members.EntityFrameworkCore;

/// <summary>EF Core context owned by the members module.</summary>
/// <param name="options">Provider and connection options supplied by the host.</param>
public sealed class MembersDbContext(DbContextOptions<MembersDbContext> options)
    : DbContext(options), IMembersUnitOfWork
{
    /// <summary>Member profiles.</summary>
    public DbSet<Member> Members => Set<Member>();

    /// <summary>Progress entries.</summary>
    public DbSet<ProgressEntry> ProgressEntries => Set<ProgressEntry>();

    /// <summary>Consent records.</summary>
    public DbSet<MemberConsent> Consents => Set<MemberConsent>();

    /// <summary>Registered push devices.</summary>
    public DbSet<MemberDevice> Devices => Set<MemberDevice>();

    /// <summary>Applies module configurations.</summary>
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        ArgumentNullException.ThrowIfNull(modelBuilder);

        modelBuilder.ApplyConfiguration(new MemberConfiguration());
        modelBuilder.ApplyConfiguration(new ProgressEntryConfiguration());
        modelBuilder.ApplyConfiguration(new MemberConsentConfiguration());
        modelBuilder.ApplyConfiguration(new MemberDeviceConfiguration());
        base.OnModelCreating(modelBuilder);
    }

    /// <summary>Stamps audit fields and persists pending changes.</summary>
    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        foreach (var entry in ChangeTracker.Entries<Kinevor.Platform.Domain.Common.Entity>())
        {
            if (entry.State == EntityState.Added)
                entry.Property(nameof(Kinevor.Platform.Domain.Common.Entity.CreatedAt)).CurrentValue = now;

            if (entry.State == EntityState.Modified)
                entry.Property(nameof(Kinevor.Platform.Domain.Common.Entity.UpdatedAt)).CurrentValue = now;
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
