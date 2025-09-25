import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
 
export default function Home() {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
 
        const formData = new FormData(e.target as HTMLFormElement);
        const name = formData.get("name") as string;
        
        console.log(name);
    };
 
    return (
        <main className="container mx-auto p-4">
            <h1 className="text-6xl font-bold">Mes Projets</h1>
            <form onSubmit={handleSubmit} className="mt-20">
                <Input name="name" placeholder="Rechercher..." />
                <Button type="submit" className="mt-2">Ajouter Nouveau Projet</Button>
            </form>
        </main>
    );
}

