using Microsoft.EntityFrameworkCore;
using NuGet.Protocol.Plugins;
using System.ComponentModel.DataAnnotations;
using System.Security.Policy;

namespace server.Models
{
    public class UserModel
    {
        [Key]
        public int UserId { get; set; }
        [Required]
        [RegularExpression(@"^[^\s\,]+$", ErrorMessage = "Username contains invalid characters")]
        [StringLength(15, MinimumLength = 5, ErrorMessage = "Username is too short or exceeding max length")]
        public string Username { get; set; }
        [Required]
        [RegularExpression(@"^([\sA-Za-z-Z0-9]+)$", ErrorMessage = "Password contains invalid characters")]
        [StringLength(30, MinimumLength = 5, ErrorMessage = "Password is too short or exceeding max length")]
        public string Password { get; set; }
        public string? Email { get; set; }
        public byte[]? Salt { get; set; }

        public ICollection<TasksModel>? Tasks { get; set; }

    }
    public class TasksModel
    {
        public int Id { get; set; }
        [Required]
        [RegularExpression(@"^([\sA-Za-z-Z0-9]+)$", ErrorMessage = "Taskname contains invalid characters")]
        [StringLength(40, MinimumLength = 3, ErrorMessage = "Taskname is too short or exceeding max length")]
        public string TaskText { get; set; }
        public bool isTaskActive { get; set; }
        public UserModel User_Id { get; set; }
    }
    public class TaskModelDTO
    {
        public int? Id { get; set; }
        [Required]
        [RegularExpression(@"^([\sA-Za-z-Z0-9]+)$", ErrorMessage = "Taskname contains invalid characters")]
        [StringLength(40, MinimumLength = 3, ErrorMessage = "Taskname is too short or exceeding max length")]
        public string TaskText { get; set; }
        public bool isTaskActive { get; set; }
    }
}
