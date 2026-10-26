using Kinevor.Modules.Members.Application;
using Kinevor.Platform.Api;
using Kinevor.Platform.Application.Common;
using Kinevor.Platform.Application.Exceptions;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Kinevor.Modules.Members.Api;

/// <summary>Self-service profile, progress, consent, device and privacy endpoints.</summary>
[ApiController, Route("api/v1/me"), Authorize(Policy = Policies.MemberOrAbove)]
public class MeController(ISender sender, ICurrentUser currentUser) : ControllerBase
{
    /// <summary>Returns the authenticated member's profile.</summary>
    [HttpGet("profile")]
    [ProducesResponseType(typeof(ApiResponse<MemberDetailDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<MemberDetailDto>>> Profile(CancellationToken ct)
    {
        var result = await sender.Send(new GetMemberByIdQuery(MemberId, true), ct);
        return Ok(ApiResponse<MemberDetailDto>.Ok(result));
    }

    /// <summary>Updates the authenticated member's profile.</summary>
    [HttpPatch("profile")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse>> UpdateProfile(
        [FromBody] MeProfileRequest request, CancellationToken ct)
    {
        await sender.Send(new UpdateMemberCommand(
            MemberId,
            request.FirstName,
            request.LastName,
            request.Phone,
            request.WeightKg,
            request.HeightCm,
            request.MedicalNotes,
            request.HasMedicalConditions,
            request.EmergencyContactName,
            request.EmergencyContactPhone), ct);

        return Ok(ApiResponse.Ok("Profile updated."));
    }

    /// <summary>Lists the member's progress entries.</summary>
    [HttpGet("progress")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<ProgressEntryDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ProgressEntryDto>>>> Progress(
        [FromQuery] DateTime? from, [FromQuery] DateTime? to, CancellationToken ct)
    {
        var result = await sender.Send(new GetMyProgressQuery(MemberId, from, to), ct);
        return Ok(ApiResponse<IReadOnlyList<ProgressEntryDto>>.Ok(result));
    }

    /// <summary>Records a progress entry for the member.</summary>
    [HttpPost("progress")]
    [ProducesResponseType(typeof(ApiResponse<ProgressCreatedDto>), StatusCodes.Status201Created)]
    public async Task<ActionResult<ApiResponse<ProgressCreatedDto>>> AddProgress(
        [FromBody] AddProgressRequest request, CancellationToken ct)
    {
        var id = await sender.Send(new AddProgressEntryCommand(
            MemberId, request.Kind, request.Label, request.Value, request.Unit,
            request.Notes, request.RecordedAt), ct);

        return Created(
            "/api/v1/me/progress",
            ApiResponse<ProgressCreatedDto>.Ok(new ProgressCreatedDto(id), "Progress recorded."));
    }

    /// <summary>Lists the member's consent records.</summary>
    [HttpGet("consents")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<ConsentDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ConsentDto>>>> Consents(CancellationToken ct)
    {
        var result = await sender.Send(new GetMyConsentsQuery(MemberId), ct);
        return Ok(ApiResponse<IReadOnlyList<ConsentDto>>.Ok(result));
    }

    /// <summary>Grants a named consent.</summary>
    [HttpPost("consents/{key}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse>> GrantConsent(string key, CancellationToken ct)
    {
        await sender.Send(new GrantConsentCommand(MemberId, key), ct);
        return Ok(ApiResponse.Ok("Consent recorded."));
    }

    /// <summary>Withdraws a named consent.</summary>
    [HttpDelete("consents/{key}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse>> WithdrawConsent(string key, CancellationToken ct)
    {
        await sender.Send(new WithdrawConsentCommand(MemberId, key), ct);
        return Ok(ApiResponse.Ok("Consent withdrawn."));
    }

    /// <summary>Lists the member's registered devices.</summary>
    [HttpGet("devices")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<DeviceDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<DeviceDto>>>> Devices(CancellationToken ct)
    {
        var result = await sender.Send(new GetMyDevicesQuery(MemberId), ct);
        return Ok(ApiResponse<IReadOnlyList<DeviceDto>>.Ok(result));
    }

    /// <summary>Registers a push device token.</summary>
    [HttpPost("devices")]
    [ProducesResponseType(typeof(ApiResponse<DeviceCreatedDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<DeviceCreatedDto>>> RegisterDevice(
        [FromBody] RegisterDeviceRequest request, CancellationToken ct)
    {
        var id = await sender.Send(new RegisterDeviceCommand(MemberId, request.Token, request.Platform), ct);
        return Ok(ApiResponse<DeviceCreatedDto>.Ok(new DeviceCreatedDto(id), "Device registered."));
    }

    /// <summary>Removes a push device token.</summary>
    [HttpDelete("devices")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse>> RemoveDevice(
        [FromBody] RemoveDeviceRequest request, CancellationToken ct)
    {
        await sender.Send(new RemoveDeviceCommand(MemberId, request.Token), ct);
        return Ok(ApiResponse.Ok("Device removed."));
    }

    /// <summary>Exports the member's personal data for this module.</summary>
    [HttpGet("privacy/export")]
    [ProducesResponseType(typeof(ApiResponse<MemberPrivacyExportDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<MemberPrivacyExportDto>>> Export(CancellationToken ct)
    {
        var result = await sender.Send(new ExportMyDataQuery(MemberId), ct);
        return Ok(ApiResponse<MemberPrivacyExportDto>.Ok(result));
    }

    /// <summary>Anonymizes the member and purges module-owned personal data.</summary>
    [HttpPost("privacy/erasure")]
    [ProducesResponseType(typeof(ApiResponse<ErasureResultDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<ErasureResultDto>>> Erasure(CancellationToken ct)
    {
        var result = await sender.Send(new EraseMyDataCommand(MemberId), ct);
        return Ok(ApiResponse<ErasureResultDto>.Ok(result));
    }

    private Guid MemberId =>
        currentUser.MemberId ?? throw new ForbiddenException("No linked member profile.");
}

/// <summary>Profile update request body.</summary>
public record MeProfileRequest(
    string FirstName,
    string LastName,
    string Phone,
    double? WeightKg,
    double? HeightCm,
    string? MedicalNotes,
    bool HasMedicalConditions,
    string? EmergencyContactName,
    string? EmergencyContactPhone);

/// <summary>Progress entry request body.</summary>
public record AddProgressRequest(
    string Kind, string? Label, double? Value, string? Unit, string? Notes, DateTime? RecordedAt);

/// <summary>Device registration request body.</summary>
public record RegisterDeviceRequest(string Token, string Platform);

/// <summary>Device removal request body.</summary>
public record RemoveDeviceRequest(string Token);

/// <summary>Created progress response.</summary>
public record ProgressCreatedDto(Guid Id);

/// <summary>Registered device response.</summary>
public record DeviceCreatedDto(Guid Id);
