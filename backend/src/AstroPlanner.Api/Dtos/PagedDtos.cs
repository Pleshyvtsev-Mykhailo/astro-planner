using System.ComponentModel.DataAnnotations;

namespace AstroPlanner.Api.Dtos;

public record PagedResult<T>(int Total, int Page, int PageSize, List<T> Items);

public class PagedQuery
{
    [Range(1, 100000)]
    public int Page { get; set; } = 1;

    [Range(1, 100)]
    public int PageSize { get; set; } = 20;

    #pragma warning disable S6964 // необов'язковий параметр запиту, значення за замовчуванням безпечне
    public bool Descending { get; set; }
    #pragma warning restore S6964
}