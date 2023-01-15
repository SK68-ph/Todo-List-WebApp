using Microsoft.EntityFrameworkCore;
using server.Models;

namespace server.Data
{
    public class UserDbContext : DbContext
    {
        public UserDbContext(DbContextOptions<UserDbContext> options)
               : base(options) { }

        public DbSet<UserModel> Users { get; set; }
        public DbSet<TasksModel> Tasks { get; set; }
    }
}
