import type { Driver } from "@/types";

export const drivers: Driver[] = [
  {
    id: "drv1",
    name: "Luis Navarro",
    phone: "+1 (212) 555-0144",
    email: "luis@samsdiscountliquor.com",
    vehicle: "Sprinter van · NY-4412",
    locationId: "loc1",
    status: "available",
    active: true,
    photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
  },
  {
    id: "drv2",
    name: "Priya Shah",
    phone: "+1 (212) 555-0171",
    email: "priya@samsdiscountliquor.com",
    vehicle: "Cargo bike · BK-882",
    locationId: "loc1",
    status: "available",
    active: true,
    photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80",
  },
  {
    id: "drv3",
    name: "Marcus Cole",
    phone: "+1 (718) 555-0160",
    email: "marcus@samsdiscountliquor.com",
    vehicle: "Box truck · BK-2291",
    locationId: "loc2",
    status: "available",
    active: true,
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
  },
  {
    id: "drv4",
    name: "Elena Rossi",
    phone: "+1 (212) 555-0194",
    email: "elena@samsdiscountliquor.com",
    vehicle: "Sprinter van · NY-7703",
    locationId: "loc3",
    status: "available",
    active: true,
    photoUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80",
  },
];

export function getDriverById(id: string) {
  return drivers.find((driver) => driver.id === id);
}

export function driversForLocation(locationId: string) {
  return drivers.filter((driver) => driver.active && driver.locationId === locationId);
}
