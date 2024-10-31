using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace QualitasAPI.model
{
    public class Template
    {
        public string Id { get; set; }
        public string Content { get; set; }

        public Template(string Id, string Content)
        {
            this.Id = Id;
            this.Content = Content;
        }
    }
}
