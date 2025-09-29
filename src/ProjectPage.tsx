import { useParams } from "react-router-dom";
import { Link } from "react-aria-components";




export default function ProjectPage() {
  const {projectId} = useParams<{ projectId: string }>();
  const id = Number(projectId);  
  
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-8">
      
        <p>Project {id}</p>
        <Link href="/"> Back home</Link>
    </div>
  );
}