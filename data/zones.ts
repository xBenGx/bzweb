import { Users, Armchair, Cigarette, CigaretteOff, Wine, Sun, Star } from "lucide-react";

export const ZONES = [
  { 
    id: "salon", 
    name: "Salón Principal", 
    capacity: 56, 
    total_tables: 14, 
    type: "Interior / Climatizado", 
    icon: Armchair,
    description: "Ambiente elegante, cálido y cerca de la barra." 
  },
  { 
    id: "vinoteca", 
    name: "La Vinoteca", 
    capacity: 12, 
    total_tables: 3, 
    type: "Privado / Exclusivo", 
    icon: Wine,
    description: "Experiencia íntima, ideal para cenas de negocios o parejas." 
  },
  { 
    id: "vip", 
    name: "Terraza VIP", 
    capacity: 60, 
    total_tables: 15, 
    type: "Terraza / Vista Panorámica", 
    icon: Star, 
    description: "La mejor ubicación del Boulevard, sector lounge exclusivo." 
  },
  { 
    id: "lat-izq", 
    name: "Lateral Izquierdo", 
    capacity: 60, 
    total_tables: 15, 
    type: "Terraza / No Fumador", 
    icon: CigaretteOff,
    description: "Espacio amplio, tranquilo y libre de humo." 
  },
  { 
    id: "lat-der", 
    name: "Lateral Derecho", 
    capacity: 40, 
    total_tables: 10, 
    type: "Terraza / Fumador", 
    icon: Cigarette,
    description: "Zona habilitada para fumadores con ventilación natural." 
  },
  { 
    id: "t1", 
    name: "Terraza 1", 
    capacity: 30, 
    total_tables: 8, 
    type: "Extensión Lat. Izq / No Fumador", 
    icon: Sun,
    description: "Pegada al lateral izquierdo, ideal para tardes de sol." 
  },
  { 
    id: "t2", 
    name: "Terraza 2", 
    capacity: 40, 
    total_tables: 10, 
    type: "Extensión / Fumador", 
    icon: Users,
    description: "Zona amplia perfecta para grupos grandes y celebraciones." 
  }
];