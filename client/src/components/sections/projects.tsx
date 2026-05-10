import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { InfiniteMovingCards } from "../ui/infinite-moving-cards";
import Heading from "../ui/heading";
import { useFeaturedProjects } from "../../hooks/queries/use-portfolio-data";
import { FaGithub, FaExternalLinkAlt } from "react-icons/fa";
import { getTechIcon } from "../../utils/tech-icons"

gsap.registerPlugin(ScrollTrigger);

interface Project {
  id: string | number;
  title: string;
  description: string;
  technologies: string[];
  image: string;
  github: string;
  live: string;
  featured: boolean;
  slug: string;
}

export default function ProjectsSection() {
  const [filter] = useState("featured");
  const { data: projectsData, isLoading, error } = useFeaturedProjects();
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const projectsRef = useRef<(HTMLDivElement | null)[]>([]);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (projectsData?.length) {
      setProjects(projectsData);
    }
  }, [projectsData]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header animation
      gsap.fromTo(headerRef.current,
        {
          opacity: 0,
          y: 100
        },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse"
          }
        }
      );

      // Filter buttons animation
      gsap.fromTo(filterRef.current,
        {
          opacity: 0,
          y: 50
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: 0.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: filterRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse"
          }
        }
      );

      // Projects staggered animation
      gsap.fromTo(projectsRef.current,
        {
          opacity: 0,
          y: 100,
          scale: 0.8
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.15,
          scrollTrigger: {
            trigger: projectsRef.current[0],
            start: "top 80%",
            toggleActions: "play none none reverse"
          }
        }
      );

      // Load more button animation
      gsap.fromTo(loadMoreRef.current,
        {
          opacity: 0,
          y: 50
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: 0.5,
          ease: "power3.out",
          scrollTrigger: {
            trigger: loadMoreRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse"
          }
        }
      );

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Filter change animation
  useEffect(() => {
    if (projectsRef.current.length > 0) {
      gsap.fromTo(projectsRef.current,
        {
          opacity: 0,
          scale: 0.8,
          y: 20
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.6,
          ease: "power3.out",
          stagger: 0.1
        }
      );
    }
  }, [filter]);

  useEffect(() => {
    if (projectsData?.data?.projects && projectsData.data.projects.length > 0) {
      const apiProjects = projectsData.data.projects.map((p: any, index: number) => ({
        id: index,
        title: p.title,
        description: p.description,
        technologies: p.technologies || [],
        image: (p.images && p.images.length > 0) ? p.images[0].url : "https://via.placeholder.com/800x400?text=Project",
        github: p.githubUrl,
        live: p.liveUrl,
        featured: !!p.featured,
        slug: p.slug || p._id,
      }));
      setProjects(apiProjects);
    } else if (error) {
      console.warn('Failed to load projects, using mock data', error);
    }
  }, [projectsData, error, projects.length]);

  const filteredProjects = filter === "all"
    ? projects
    : filter === "featured"
      ? projects.filter(p => p.featured)
      : projects.filter(p => !p.featured);

  return (
    <section
      ref={sectionRef}
      id="projects-section"
      className="bg-black text-white px-4 md:px-10"
    >
      {/* Status banners */}
      <div className="max-w-[1200px] mx-auto mb-4">
        {isLoading && (
          <p className="text-sm text-gray-400 text-center">Loading latest projects — showing sample content</p>
        )}
        {error && (
          <p className="text-sm text-yellow-400 text-center">Unable to load projects — showing sample content</p>
        )}
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Heading
          heading={"Featured Projects"}
          paragraph={"A collection of projects that showcase my skills in modern web development, from concept to deployment."}
        />

        {/* Projects Grid */}
        <div className="my-12">
          <InfiniteMovingCards
            items={filteredProjects}
            direction="left"
            speed="normal"
            pauseOnHover={true}
            className=""
            renderItem={(project) => (
              <div className="group relative backdrop-blur-[10px] rounded-[20px] overflow-hidden transition-all duration-300 hover:border-[#fafafa15] cursor-pointer flex flex-col h-full text-white bg-white/5 border border-white/10 shadow-xl">
                {/* Project Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={project.image}
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
                  <h3 className="text-xl font-bold mb-3 group-hover:text-purple-500 transition-colors duration-300">
                    {project.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                    {project.description}
                  </p>
                  {/* Technologies */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.technologies.map((tech: any) => (
                      <span
                        key={tech}
                        className="flex items-center gap-1.5 px-3 py-1 text-xs backdrop-blur-[10px] rounded-full border border-gray-600 text-gray-300 hover:border-[#fafafa15] transition-all duration-200"
                        title={tech}
                      >
                        <span className="text-sm">
                          {getTechIcon(tech)}
                        </span>
                        {tech}
                      </span>
                    ))}
                  </div>
                  {/* Links */}
                  <div className="flex gap-3 mt-auto">
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 text-sm backdrop-blur-[10px] rounded-full border border-[#fafafa0d] hover:border-[#fafafa20] transition-all duration-300 hover:bg-white/5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FaGithub />
                      Code
                    </a>
                    <a
                      href={project.live}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 text-sm bg-white text-black rounded-full hover:bg-gray-200 transition-all duration-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FaExternalLinkAlt />
                      Live Demo
                    </a>
                  </div>
                </div>
              </div>
            )}
          />
        </div>

        {!filteredProjects.length && !isLoading && (
          <div className="flex justify-center items-center h-full">
            <p>No featured projects found</p>
          </div>
        )}

        {/* Load More Button */}
        <div ref={loadMoreRef} className="text-center mt-16 md:flex justify-center hidden">
          <button className="px-8 py-4 backdrop-blur-[10px] rounded-[33px] border border-[#fafafa0d] hover:border-[#fafafa20] transition-all duration-300 hover:bg-white/5 text-gray-300 hover:text-white">
            View All Projects
          </button>
        </div>
      </div>
    </section>
  );
}