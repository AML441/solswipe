import Card from "@/components/card";
import { Organization } from "@/types/organization";
import Navbar from "@/components/navbar";
import LayoutWithSidebar from "@/components/navbar";

export default function testing() {
    const items: Organization[] = [
        { name: "Org A", description: "Description A", tags: [], contact: "a@gmail.com"},
        { name: "Org B", description: "Description B", tags: [], contact: "b@gmail.com"},
        { name: "Org C", description: "Description C", tags: [], contact: "c@gmail.com"},
        { name: "Org D", description: "Description D", tags: [], contact: "d@gmail.com"},
        // add as many as you want
      ];
    
      return (
        <div>
            <div>
                <LayoutWithSidebar />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {items.map((item, i) => (
                <Card key={i} org={item.name} desc={item.description} contact={item.contact} />
            ))}
            </div>
        </div>
      );
}

