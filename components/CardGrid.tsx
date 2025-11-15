import Card from "./card";

export default function CardGrid() {
  const items = [
    { org: "Org A", desc: "Description A" },
    { org: "Org B", desc: "Description B" },
    { org: "Org C", desc: "Description C" },
    { org: "Org D", desc: "Description D" },
    // add as many as you want
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {items.map((item, i) => (
        <Card key={i} org={item.org} desc={item.desc} />
      ))}
    </div>
  );
}
