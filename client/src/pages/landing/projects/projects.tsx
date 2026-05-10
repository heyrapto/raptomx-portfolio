import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../../components/ui/page-header';
import { useNavigate } from 'react-router-dom';
import { FaGithub, FaExternalLinkAlt } from 'react-icons/fa';
import EmptyState from '../../../components/states/empty';
import { ProjectSkeleton } from '../../../components/states/skeleton-loading';
import ErrorState from '../../../components/states/error';
import { useProjects } from '../../../hooks/queries/use-portfolio-data';
import { techIcons } from '../../../config/tech-icons';


const Projects: React.FC = () => {
  const [filter, setFilter] = useState("all");
  // keep local state as any[] so we can accept both API and mock shapes, then render safely
  const [projects, setProjects] = useState<any[]>([]);
  const navigate = useNavigate();
  const { data: projectsData, isLoading, error } = useProjects();

  useEffect(() => {
    if (projectsData?.data?.projects && projectsData.data.projects.length > 0) {
      setProjects(projectsData.data.projects);
    } else if (error) {
      console.warn('Failed to load projects, using mock data', error);
    }
  }, [projectsData, error]);

  const safeProjects = projects ?? [];
  const filteredProjects = filter === "all"
    ? safeProjects
    : filter === "featured"
      ? safeProjects.filter((p: any) => p.featured)
      : safeProjects.filter((p: any) => !p.featured);

  return (
    <div className="min-h-screen text-white flex flex-col">
      <PageHeader
        heading="Projects"
        paragraph="Explore some of my best work, from web apps to open-source contributions."
      />
      {/* Status banners */}
      <div className="w-full max-w-[1200px] mx-auto mt-6">
        {isLoading && (
          <p className="text-sm text-gray-400 text-center mb-4">Loading latest projects — showing sample content</p>
        )}
        {error && (
          <p className="text-sm text-yellow-400 text-center mb-4">Unable to load projects — showing sample content</p>
        )}
      </div>

      {/* Filter Buttons */}
      <div className="flex justify-center mb-16">
        <div className="flex gap-2 p-2 backdrop-blur-[10px] rounded-[33px] border border-[#fafafa0d]">
          {["all", "featured", "other"].map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-6 py-2 rounded-[25px] text-[1.2rem] font-medium transition-all duration-300 capitalize ${filter === filterType
                ? "bg-white text-black"
                : "text-gray-300 hover:text-white hover:bg-white/10"
                }`}
            >
              {filterType}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="max-w-[1200px] mx-auto px-4 pb-24 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects?.map((project: any) => (
            <div
              key={project._id || project.id}
              className="group relative backdrop-blur-[10px] rounded-[20px] overflow-hidden transition-all duration-300 hover:border-[#fafafa15] cursor-pointer flex flex-col h-full text-white bg-white/5 border border-white/10 shadow-xl hover:shadow-2xl hover:transform hover:scale-[1.02]"
              onClick={() => navigate(`/projects/${project._id || project.id}`)}
            >
              {/* Project Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={project.images?.[0]?.url || project.image || `https://via.placeholder.com/400x200/1a1a1a/ffffff?text=${encodeURIComponent(project.title || 'Project')}`}
                  alt={project.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                {/* Featured Badge */}
                {project.featured && (
                  <div className="absolute top-4 left-4 px-3 py-1 backdrop-blur-[10px] rounded-full border border-[#fafafa0d] text-xs font-medium">
                    Featured
                  </div>
                )}
              </div>

              {/* Project Content */}
              <div className="p-6 flex flex-col h-full">
                <h3 className="text-2xl font-bold mb-3 group-hover:text-purple-500 transition-colors duration-300">
                  {project.title}
                </h3>
                <p className="text-gray-400 text-lg mb-4 line-clamp-3">
                  {project.description}
                </p>

                {/* Technologies */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {(project.technologies ?? []).slice(0, 4).map((tech: any) => (
                    <span
                      key={tech}
                      className="flex items-center gap-1.5 px-3 py-1 text-sm backdrop-blur-[10px] rounded-full border border-gray-600 text-gray-300 hover:border-[#fafafa15] transition-all duration-200"
                      title={tech}
                    >
                      <span className="text-base">
                        {techIcons[tech] || <span className="text-gray-400">•</span>}
                      </span>
                      {tech}
                    </span>
                  ))}
                  {(project.technologies ?? []).length > 4 && (
                    <span className="flex items-center gap-1.5 px-3 py-1 text-sm backdrop-blur-[10px] rounded-full border border-gray-600 text-gray-300">
                      +{(project.technologies ?? []).length - 4}
                    </span>
                  )}
                </div>

                {/* Links */}
                <div className="flex gap-3 mt-auto" onClick={(e) => e.stopPropagation()}>
                  <a
                    href={project.githubUrl || project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 text-sm backdrop-blur-[10px] rounded-full border border-[#fafafa0d] hover:border-[#fafafa20] transition-all duration-300 hover:bg-white/5"
                  >
                    <FaGithub />
                    Code
                  </a>
                  <a
                    href={project.liveUrl || project.live}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-white text-black rounded-full hover:bg-gray-200 transition-all duration-300"
                  >
                    <FaExternalLinkAlt />
                    Live Demo
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <ErrorState title={"Error loading project data"} message={"Please try again"} />
      )}

      {isLoading && (
        <ProjectSkeleton />
      )}

      {(!safeProjects || safeProjects.length === 0) && !isLoading && !error && (
        <EmptyState title={"No project found"} message={"No projects available at the moment"} />
      )}
    </div>
  );
};

export default Projects; 