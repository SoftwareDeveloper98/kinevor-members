using Kinevor.Modules.Members.Domain;
using Kinevor.Platform.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Kinevor.Modules.Members.EntityFrameworkCore;

/// <summary>EF Core mapping for <see cref="Member"/>.</summary>
public sealed class MemberConfiguration : IEntityTypeConfiguration<Member>
{
    /// <summary>Configures keys, indexes and value conversions.</summary>
    public void Configure(EntityTypeBuilder<Member> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable("Members");
        builder.HasKey(member => member.Id);
        builder.Property(member => member.MemberNumber).HasMaxLength(20).IsRequired();
        builder.HasIndex(member => member.MemberNumber).IsUnique();
        builder.Property(member => member.FirstName).HasMaxLength(100).IsRequired();
        builder.Property(member => member.LastName).HasMaxLength(100).IsRequired();
        builder.Property(member => member.Email)
            .HasConversion(email => email.Value, value => Email.Create(value).Value)
            .HasMaxLength(200)
            .IsRequired();
        builder.HasIndex(member => member.Email).IsUnique();
        builder.Property(member => member.Phone)
            .HasConversion(phone => phone.Value, value => PhoneNumber.Create(value).Value)
            .HasMaxLength(30)
            .IsRequired();
        builder.Property(member => member.Gender).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(member => member.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(member => member.MedicalNotes).HasMaxLength(2000);
        builder.Property(member => member.AddressLine1).HasMaxLength(200).IsRequired();
        builder.Property(member => member.AddressLine2).HasMaxLength(200);
        builder.Property(member => member.City).HasMaxLength(100).IsRequired();
        builder.Property(member => member.State).HasMaxLength(100);
        builder.Property(member => member.Country).HasMaxLength(100).IsRequired();
        builder.Property(member => member.PostalCode).HasMaxLength(20);
        builder.Property(member => member.EmergencyContactName).HasMaxLength(160);
        builder.Property(member => member.EmergencyContactPhone).HasMaxLength(30);
        builder.Property(member => member.FreezeReason).HasMaxLength(500);
        builder.Property(member => member.PhotoUrl).HasMaxLength(500);
        builder.HasIndex(member => member.Status);
        builder.HasIndex(member => member.BranchId);
        builder.Ignore(member => member.DomainEvents);
    }
}

/// <summary>EF Core mapping for <see cref="ProgressEntry"/>.</summary>
public sealed class ProgressEntryConfiguration : IEntityTypeConfiguration<ProgressEntry>
{
    /// <summary>Configures keys, indexes and lengths.</summary>
    public void Configure(EntityTypeBuilder<ProgressEntry> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable("ProgressEntries");
        builder.HasKey(entry => entry.Id);
        builder.Property(entry => entry.Kind).HasConversion<string>().HasMaxLength(30).IsRequired();
        builder.Property(entry => entry.Label).HasMaxLength(160);
        builder.Property(entry => entry.Unit).HasMaxLength(30);
        builder.Property(entry => entry.Notes).HasMaxLength(1000);
        builder.HasIndex(entry => new { entry.MemberId, entry.RecordedAt });
    }
}

/// <summary>EF Core mapping for <see cref="MemberConsent"/>.</summary>
public sealed class MemberConsentConfiguration : IEntityTypeConfiguration<MemberConsent>
{
    /// <summary>Configures keys and unique member/key pairs.</summary>
    public void Configure(EntityTypeBuilder<MemberConsent> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable("MemberConsents");
        builder.HasKey(consent => consent.Id);
        builder.Property(consent => consent.Key).HasMaxLength(80).IsRequired();
        builder.Property(consent => consent.Version).HasMaxLength(30).IsRequired();
        builder.Property(consent => consent.Culture).HasMaxLength(10).IsRequired();
        builder.Property(consent => consent.Source).HasMaxLength(40).IsRequired();
        builder.HasIndex(consent => new { consent.MemberId, consent.Key }).IsUnique();
    }
}

/// <summary>EF Core mapping for <see cref="MemberDevice"/>.</summary>
public sealed class MemberDeviceConfiguration : IEntityTypeConfiguration<MemberDevice>
{
    /// <summary>Configures keys and token uniqueness.</summary>
    public void Configure(EntityTypeBuilder<MemberDevice> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable("MemberDevices");
        builder.HasKey(device => device.Id);
        builder.Property(device => device.Token).HasMaxLength(500).IsRequired();
        builder.Property(device => device.Platform).HasMaxLength(20).IsRequired();
        builder.HasIndex(device => device.Token).IsUnique();
        builder.HasIndex(device => device.MemberId);
    }
}
