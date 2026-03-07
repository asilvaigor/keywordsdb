const stats = [
  { value: "290M+", label: "Keywords indexed" },
  { value: "17", label: "Data points per keyword" },
  { value: "Real-time", label: "Google Search data" },
  { value: "Weekly", label: "Data updates" },
];

function Stats() {
  return (
    <section className="border-y bg-muted/30 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-primary md:text-4xl">
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Stats;
