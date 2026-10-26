using Kinevor.Platform.Application.Common;
using Kinevor.Platform.Application.Exceptions;
using MediatR;

namespace Kinevor.Modules.Members.Application;

/// <summary>Lists members with search, status filter and paging.</summary>
public record GetMembersQuery(string? Search, string? Status, int Page = 1, int PageSize = 20)
    : IRequest<PagedResult<MemberSummaryDto>>;

/// <summary>Handles <see cref="GetMembersQuery"/>.</summary>
public class GetMembersHandler(IMemberRepository members, TimeProvider clock)
    : IRequestHandler<GetMembersQuery, PagedResult<MemberSummaryDto>>
{
    /// <summary>Returns the matching page of member summaries.</summary>
    public async Task<PagedResult<MemberSummaryDto>> Handle(GetMembersQuery query, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(query);

        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);
        var (items, total) = await members.SearchAsync(query.Search, query.Status, page, pageSize, ct);
        var now = clock.GetUtcNow().UtcDateTime;

        return new PagedResult<MemberSummaryDto>(
            items.Select(member => MemberMapper.ToSummary(member, now)).ToList(),
            total,
            page,
            pageSize);
    }
}

/// <summary>Returns one member, optionally revealing sensitive fields.</summary>
public record GetMemberByIdQuery(Guid Id, bool Reveal = false) : IRequest<MemberDetailDto>;

/// <summary>Handles <see cref="GetMemberByIdQuery"/>.</summary>
public class GetMemberByIdHandler(IMemberRepository members, TimeProvider clock)
    : IRequestHandler<GetMemberByIdQuery, MemberDetailDto>
{
    /// <summary>Loads the member and maps the requested projection.</summary>
    public async Task<MemberDetailDto> Handle(GetMemberByIdQuery query, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(query);

        var member = await members.GetByIdAsync(query.Id, ct)
            ?? throw new NotFoundException("Member", query.Id);
        return MemberMapper.ToDetail(member, query.Reveal, clock.GetUtcNow().UtcDateTime);
    }
}
