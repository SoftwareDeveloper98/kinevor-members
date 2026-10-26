using Kinevor.Platform.Domain.Common;

namespace Kinevor.Modules.Members.Domain;

/// <summary>Push-notification device registered by a member.</summary>
public sealed class MemberDevice : Entity
{
    private MemberDevice()
    {
    }

    /// <summary>Member who owns the device.</summary>
    public Guid MemberId { get; private set; }

    /// <summary>Opaque push token.</summary>
    public string Token { get; private set; } = string.Empty;

    /// <summary>Platform name: ios, android or web.</summary>
    public string Platform { get; private set; } = string.Empty;

    /// <summary>Creates a device registration.</summary>
    public static Result<MemberDevice> Create(Guid memberId, string token, string platform)
    {
        if (string.IsNullOrWhiteSpace(token))
            return Result.Failure<MemberDevice>(Error.Validation("Token", "Device token is required."));

        var normalizedPlatform = (platform ?? string.Empty).Trim().ToLowerInvariant();
        if (normalizedPlatform is not ("ios" or "android" or "web"))
            return Result.Failure<MemberDevice>(Error.Validation("Platform", "Platform must be ios, android or web."));

        return Result.Success(new MemberDevice
        {
            MemberId = memberId,
            Token = token.Trim(),
            Platform = normalizedPlatform,
        });
    }
}
