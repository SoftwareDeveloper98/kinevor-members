using Kinevor.Modules.Members.Application;
using Kinevor.Platform.Api;
using Kinevor.Platform.Application.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Kinevor.Modules.Members.Api;

/// <summary>Staff-facing member management endpoints.</summary>
[ApiController, Route("api/v1/members"), Authorize(Policy = Policies.StaffOrAdmin)]
public class MembersController(ISender sender) : ControllerBase
{
    /// <summary>Lists members with optional search and status filters.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<MemberSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<PagedResult<MemberSummaryDto>>>> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await sender.Send(new GetMembersQuery(search, status, page, pageSize), ct);
        return Ok(ApiResponse<PagedResult<MemberSummaryDto>>.Ok(result));
    }

    /// <summary>Returns a member; sensitive fields stay masked unless <paramref name="reveal"/> is true.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<MemberDetailDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<MemberDetailDto>>> GetById(
        Guid id, [FromQuery] bool reveal = false, CancellationToken ct = default)
    {
        var result = await sender.Send(new GetMemberByIdQuery(id, reveal), ct);
        return Ok(ApiResponse<MemberDetailDto>.Ok(result));
    }

    /// <summary>Registers a member with optional consent records.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<MemberCreatedDto>), StatusCodes.Status201Created)]
    public async Task<ActionResult<ApiResponse<MemberCreatedDto>>> Register(
        [FromBody] RegisterMemberRequest request, CancellationToken ct)
    {
        var id = await sender.Send(new RegisterMemberCommand(
            request.FirstName,
            request.LastName,
            request.Email,
            request.Phone,
            request.DateOfBirth,
            request.Gender,
            request.WeightKg,
            request.HeightCm,
            request.MedicalNotes,
            request.HasMedicalConditions,
            request.AddressLine1,
            request.AddressLine2,
            request.City,
            request.State,
            request.Country,
            request.PostalCode,
            request.EmergencyContactName,
            request.EmergencyContactPhone,
            request.PhotoUrl,
            request.Consents), ct);

        return CreatedAtAction(
            nameof(GetById),
            new { id },
            ApiResponse<MemberCreatedDto>.Ok(new MemberCreatedDto(id), "Member registered."));
    }

    /// <summary>Updates a member's profile and health details.</summary>
    [HttpPatch("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse>> Update(
        Guid id, [FromBody] UpdateMemberRequest request, CancellationToken ct)
    {
        await sender.Send(new UpdateMemberCommand(
            id,
            request.FirstName,
            request.LastName,
            request.Phone,
            request.WeightKg,
            request.HeightCm,
            request.MedicalNotes,
            request.HasMedicalConditions,
            request.EmergencyContactName,
            request.EmergencyContactPhone), ct);

        return Ok(ApiResponse.Ok("Member updated."));
    }

    /// <summary>Freezes a member until a date with a reason.</summary>
    [HttpPost("{id:guid}/freeze")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse>> Freeze(
        Guid id, [FromBody] FreezeMemberRequest request, CancellationToken ct)
    {
        await sender.Send(new FreezeMemberCommand(id, request.Reason, request.FrozenUntil), ct);
        return Ok(ApiResponse.Ok("Member frozen."));
    }

    /// <summary>Unfreezes a frozen member.</summary>
    [HttpPost("{id:guid}/unfreeze")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse>> Unfreeze(Guid id, CancellationToken ct)
    {
        await sender.Send(new UnfreezeMemberCommand(id), ct);
        return Ok(ApiResponse.Ok("Member unfrozen."));
    }
}

/// <summary>Registration request body.</summary>
public record RegisterMemberRequest(
    string FirstName,
    string LastName,
    string Email,
    string Phone,
    DateTime DateOfBirth,
    string Gender,
    double? WeightKg,
    double? HeightCm,
    string? MedicalNotes,
    bool HasMedicalConditions,
    string AddressLine1,
    string? AddressLine2,
    string City,
    string? State,
    string Country,
    string? PostalCode,
    string? EmergencyContactName,
    string? EmergencyContactPhone,
    string? PhotoUrl = null,
    IReadOnlyList<ConsentInput>? Consents = null);

/// <summary>Profile update request body.</summary>
public record UpdateMemberRequest(
    string FirstName,
    string LastName,
    string Phone,
    double? WeightKg,
    double? HeightCm,
    string? MedicalNotes,
    bool HasMedicalConditions,
    string? EmergencyContactName,
    string? EmergencyContactPhone);

/// <summary>Freeze request body.</summary>
public record FreezeMemberRequest(string Reason, DateTime FrozenUntil);

/// <summary>Created member response.</summary>
public record MemberCreatedDto(Guid Id);
