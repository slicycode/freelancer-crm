import { getProjects } from "@/app/actions/projects";
import { ProjectListView } from "@/components/project-list";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects - FreelancerCRM",
  description: "Manage your projects and track their progress",
};

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="flex flex-col h-full">
      <ProjectListView projects={projects} />
    </div>
  );
} 