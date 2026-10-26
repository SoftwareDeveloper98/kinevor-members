namespace Kinevor.Modules.Members.Domain;

/// <summary>Well-known consent keys captured by the member module.</summary>
public static class ConsentKeys
{
    /// <summary>Consent to store medical notes and conditions.</summary>
    public const string HealthData = "health_data";

    /// <summary>Consent to receive marketing messages.</summary>
    public const string Marketing = "marketing";

    /// <summary>Consent to use progress photos.</summary>
    public const string ProgressPhotos = "progress_photos";

    /// <summary>Consent to anonymized product analytics.</summary>
    public const string Analytics = "analytics";

    /// <summary>Current policy version recorded on new consents.</summary>
    public const string CurrentVersion = "2026-10";
}
