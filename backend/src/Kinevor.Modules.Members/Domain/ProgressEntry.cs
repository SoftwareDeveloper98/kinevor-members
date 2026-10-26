using Kinevor.Platform.Domain.Common;

namespace Kinevor.Modules.Members.Domain;

/// <summary>A weight, measurement, record or photo entry recorded by a member.</summary>
public sealed class ProgressEntry : Entity
{
    private ProgressEntry()
    {
    }

    /// <summary>Member who recorded the entry.</summary>
    public Guid MemberId { get; private set; }

    /// <summary>Entry category.</summary>
    public ProgressKind Kind { get; private set; }

    /// <summary>Optional label such as "Deadlift" or "Waist".</summary>
    public string? Label { get; private set; }

    /// <summary>Optional numeric value.</summary>
    public double? Value { get; private set; }

    /// <summary>Unit for <see cref="Value"/>.</summary>
    public string? Unit { get; private set; }

    /// <summary>Optional free-text note.</summary>
    public string? Notes { get; private set; }

    /// <summary>When the measurement was taken.</summary>
    public DateTime RecordedAt { get; private set; }

    /// <summary>Creates a validated progress entry.</summary>
    public static Result<ProgressEntry> Create(
        Guid memberId,
        ProgressKind kind,
        string? label,
        double? value,
        string? unit,
        string? notes,
        DateTime recordedAt,
        DateTime now)
    {
        if (memberId == Guid.Empty)
            return Result.Failure<ProgressEntry>(Error.Validation("MemberId", "Member id is required."));
        if (recordedAt > now.AddMinutes(5))
            return Result.Failure<ProgressEntry>(Error.Validation("RecordedAt", "Recorded time cannot be in the future."));
        if (value is < 0)
            return Result.Failure<ProgressEntry>(Error.Validation("Value", "Value cannot be negative."));
        if ((kind is ProgressKind.PersonalRecord or ProgressKind.Photo) && string.IsNullOrWhiteSpace(label))
            return Result.Failure<ProgressEntry>(Error.Validation("Label", "A label is required for records and photos."));

        return Result.Success(new ProgressEntry
        {
            MemberId = memberId,
            Kind = kind,
            Label = label?.Trim(),
            Value = value,
            Unit = unit?.Trim(),
            Notes = notes?.Trim(),
            RecordedAt = recordedAt,
        });
    }
}
