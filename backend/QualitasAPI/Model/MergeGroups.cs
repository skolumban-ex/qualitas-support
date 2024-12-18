using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace QualitasAPI.model
{
    public class MergeGroups
    {
        public List<List<string>> Columns { get; set; } = new();
        public Dictionary<string, List<string>> ValueMappings { get; set; } = new();
        public List<string> ResultColumnName { get; set; }
    }
}