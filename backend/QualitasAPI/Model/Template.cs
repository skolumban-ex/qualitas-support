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
        public List<MergeGroups> MergeGroups { get; set; } = new();
    }
}