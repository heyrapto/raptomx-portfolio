import { useNavigate } from "react-router-dom";
import BlogCard from "../ui/blog-card";
import { useBlogs } from "../../hooks/queries/use-portfolio-data";
import { useEffect, useState } from "react";
import { BlogProps } from "../../types/blog";

const mockBlogs: BlogProps[] = [
  {
    _id: 1,
    title: 'Building Scalable Web Applications',
    info: 'Learn how to architect and build web applications that can handle millions of users with optimal performance.',
    author: 'John Developer',
    time: '8 min read',
    avatar: 'https://picsum.photos/800/400?random=1',
    featured: true
  },
  {
    _id: 2,
    title: 'Modern Frontend Development Practices',
    info: 'Explore the latest practices and tools in frontend development that help create better user experiences.',
    author: 'Sarah Engineer',
    time: '6 min read',
    avatar: 'https://picsum.photos/800/400?random=2',
    featured: true
  },
  {
    _id: 3,
    title: 'Getting Started with TypeScript',
    info: 'A comprehensive guide to start using TypeScript in your JavaScript projects for better type safety.',
    author: 'Mike Coder',
    time: '10 min read',
    avatar: 'https://picsum.photos/800/400?random=3',
  },
  {
    _id: 4,
    title: 'State Management in React Applications',
    info: 'Compare different state management solutions and learn when to use each in your React applications.',
    author: 'Emily React',
    time: '7 min read',
    avatar: 'https://picsum.photos/800/400?random=4',
  }
];

const BlogList = () => {
    const navigate = useNavigate();
    const [blogs, setBlogs] = useState<BlogProps[]>(mockBlogs);
    const { data: blogsData, isLoading, error } = useBlogs();

    useEffect(() => {
        if (blogsData?.data?.blogs && blogsData.data.blogs.length > 0) {
            setBlogs(blogsData.data.blogs);
        } else if (error) {
            console.warn('Failed to load blogs, using mock data', error);
            if (blogs.length === 0) setBlogs(mockBlogs);
        }
    }, [blogsData, error, blogs.length]);

    const featuredBlogs = blogs?.filter(blog => blog.featured);
    const allBlogs = blogs;

    return (
    <div className="flex flex-col w-full p-4 md:p-[30px] gap-8 md:gap-12">
            {/* Status banners */}
            <div className="w-full max-w-[1200px] mx-auto">
                {isLoading && (
                    <p className="text-sm text-gray-400 text-center mb-4">Loading latest blog posts — showing sample content</p>
                )}
                {error && (
                    <p className="text-sm text-yellow-400 text-center mb-4">Unable to load blog posts — showing sample content</p>
                )}
            </div>

            {/* Featured Posts */}
            <div>
                <h1 className="font-medium text-2xl md:text-4xl pb-4 md:pb-[35px]">Featured</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-2">
                    {featuredBlogs?.map((blog: BlogProps) => (
                        <BlogCard 
                            key={blog.id}
                            title={blog.title}
                            paragraph={blog.info}
                            author={blog.author}
                            time={blog.time}
                            avatar={blog.avatar}
                            onClick={() => navigate(`/blogs/${blog._id}`)}
                        />
                    ))}
                </div>
            </div>

            {/* All Posts */}
            <div>
                <h1 className="font-medium text-2xl md:text-4xl pb-4 md:pb-[35px]">All Posts</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-2">
                    {allBlogs?.map((blog: BlogProps) => (
                        <BlogCard 
                            key={blog.id}
                            title={blog.title}
                            paragraph={blog.info}
                            author={blog.author}
                            time={blog.time}
                            avatar={blog.avatar}
                            onClick={() => navigate(`/blogs/${blog._id}`)}
                        />
                    ))}
                </div>
            </div>

            {(!blogs || blogs.length === 0) && !isLoading && (
                <div className="flex justify-center items-center py-20">
                    <p className="text-gray-400">No blog posts available</p>
                </div>
            )}
        </div>
  )
}

export default BlogList;
