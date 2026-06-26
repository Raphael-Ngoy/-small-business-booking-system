"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Service = {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  active: boolean;
};

export default function PublicServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("active");

  useEffect(() => {
    fetchServices();
  }, [search, filter]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filter !== "all") params.append("active", filter === "active" ? "true" : "false");

      const res = await fetch(`/api/services?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      }
    } catch (error) {
      console.error("Failed to fetch services:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="services" className="py-32 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Our Services
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Professional services tailored to your needs
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12 max-w-2xl mx-auto">
          <div className="flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search services..."
              className="w-full bg-black border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as "all" | "active" | "inactive")}
              className="w-full sm:w-auto bg-black border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Services</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="text-center text-gray-500 py-12">Loading services...</div>
        ) : services.length === 0 ? (
          <div className="text-center text-gray-500 py-12">No services found</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div
                key={service.id}
                className={`border bg-white/[0.03] p-8 transition-all group relative ${
                  service.active
                    ? "border-white/10 hover:border-cyan-500/30 hover:bg-white/[0.05]"
                    : "border-white/5 opacity-60"
                }`}
              >
                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {service.active ? (
                    <span className="text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/30 px-2 py-0.5">
                      Active
                    </span>
                  ) : (
                    <span className="text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/30 px-2 py-0.5">
                      Inactive
                    </span>
                  )}
                  <span className="text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5">
                    {service.duration} min
                  </span>
                  <span className="text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5">
                    ${service.price}
                  </span>
                </div>

                <h3 className="text-2xl font-semibold mb-3 group-hover:text-cyan-500 transition-colors">
                  {service.name}
                </h3>
                {service.description && (
                  <p className="text-gray-400 mb-4 leading-relaxed">{service.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-cyan-500 text-lg font-bold">
                    ${service.price}
                  </span>
                  <span className="text-sm text-gray-500">
                    {service.duration} min
                  </span>
                </div>
                {service.active ? (
                  <Link
                    href={`/book?service=${service.id}`}
                    className="mt-6 block w-full text-center border border-cyan-500/50 text-cyan-500 font-semibold py-3 hover:bg-cyan-500 hover:text-black transition-all"
                  >
                    Book {service.name}
                  </Link>
                ) : (
                  <div className="mt-6 block w-full text-center border border-white/10 text-gray-500 font-semibold py-3">
                    Currently Unavailable
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}