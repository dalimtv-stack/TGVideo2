import dune from "@/assets/dune.asset.json";
import interstellar from "@/assets/interstellar.asset.json";
import wire from "@/assets/wire.asset.json";
import blade from "@/assets/blade.asset.json";
import oppenheimer from "@/assets/oppenheimer.asset.json";
import lastofus from "@/assets/lastofus.asset.json";
import arrival from "@/assets/arrival.asset.json";
import dark from "@/assets/dark.asset.json";
export type Episode = {
  channelId: string;
  messageId: number;
  name: string;
  size: number;
  mime: string;
};
export type Title = {
  id: number | string;
  title: string;
  original: string;
  type: "movie" | "series";
  year: number;
  rating: string;
  age: number;
  genre: string;
  duration: string;
  image: string;
  synopsis: string;
  director: string;
  cast: string;
  group: string;
  progress?: number | undefined;
  tmdbId?: string;
  backdrop?: string;
  episodes?: Episode[];
  source?: "telegram";
};
export const catalog: Title[] = [
  {
    id: 1,
    title: "Dune: Parte dos",
    original: "DUNE",
    type: "movie",
    year: 2024,
    rating: "8.5",
    age: 12,
    genre: "Ciencia ficción",
    duration: "2 h 46 min",
    image: dune.url,
    synopsis:
      "Paul Atreides se une a Chani y a los Fremen mientras busca venganza contra los conspiradores que destruyeron a su familia. Entre el amor y el destino del universo, deberá evitar un futuro que solo él puede prever.",
    director: "Denis Villeneuve",
    cast: "Timothée Chalamet, Zendaya, Rebecca Ferguson",
    group: "2020–2029",
  },
  {
    id: 2,
    title: "Interstellar",
    original: "INTERSTELLAR",
    type: "movie",
    year: 2014,
    rating: "8.7",
    age: 12,
    genre: "Ciencia ficción",
    duration: "2 h 49 min",
    image: interstellar.url,
    synopsis:
      "Un grupo de exploradores viaja más allá de esta galaxia para descubrir si la humanidad tiene un futuro entre las estrellas.",
    director: "Christopher Nolan",
    cast: "Matthew McConaughey, Anne Hathaway, Jessica Chastain",
    group: "2010–2019",
    progress: 42,
  },
  {
    id: 3,
    title: "The Last of Us",
    original: "THE LAST OF US",
    type: "series",
    year: 2023,
    rating: "8.7",
    age: 18,
    genre: "Drama",
    duration: "2 temporadas",
    image: lastofus.url,
    synopsis:
      "Veinte años después del colapso de la civilización, Joel y Ellie emprenden un peligroso viaje a través de Estados Unidos.",
    director: "Craig Mazin, Neil Druckmann",
    cast: "Pedro Pascal, Bella Ramsey",
    group: "HBO",
    progress: 67,
  },
  {
    id: 4,
    title: "Blade Runner 2049",
    original: "BLADE RUNNER",
    type: "movie",
    year: 2017,
    rating: "8.0",
    age: 16,
    genre: "Ciencia ficción",
    duration: "2 h 44 min",
    image: blade.url,
    synopsis:
      "Un nuevo blade runner descubre un secreto que podría sumir lo que queda de la sociedad en el caos.",
    director: "Denis Villeneuve",
    cast: "Ryan Gosling, Harrison Ford, Ana de Armas",
    group: "2010–2019",
    progress: 24,
  },
  {
    id: 5,
    title: "The Wire",
    original: "THE WIRE",
    type: "series",
    year: 2002,
    rating: "9.3",
    age: 16,
    genre: "Crimen",
    duration: "5 temporadas",
    image: wire.url,
    synopsis:
      "Una mirada a Baltimore a través de los ojos de quienes viven a ambos lados de la ley.",
    director: "David Simon",
    cast: "Dominic West, Idris Elba, John Doman",
    group: "HBO",
    progress: 81,
  },
  {
    id: 6,
    title: "Oppenheimer",
    original: "OPPENHEIMER",
    type: "movie",
    year: 2023,
    rating: "8.3",
    age: 12,
    genre: "Historia",
    duration: "3 h",
    image: oppenheimer.url,
    synopsis:
      "La historia de J. Robert Oppenheimer y su papel en el desarrollo de la bomba atómica.",
    director: "Christopher Nolan",
    cast: "Cillian Murphy, Emily Blunt, Robert Downey Jr.",
    group: "2020–2029",
  },
  {
    id: 7,
    title: "La llegada",
    original: "ARRIVAL",
    type: "movie",
    year: 2016,
    rating: "7.9",
    age: 12,
    genre: "Ciencia ficción",
    duration: "1 h 56 min",
    image: arrival.url,
    synopsis:
      "Una lingüista busca comprender el lenguaje de unos visitantes extraterrestres antes de que el miedo divida al mundo.",
    director: "Denis Villeneuve",
    cast: "Amy Adams, Jeremy Renner, Forest Whitaker",
    group: "2010–2019",
  },
  {
    id: 8,
    title: "Dark",
    original: "DARK",
    type: "series",
    year: 2017,
    rating: "8.7",
    age: 16,
    genre: "Misterio",
    duration: "3 temporadas",
    image: dark.url,
    synopsis:
      "La desaparición de un niño revela los secretos de cuatro familias y un misterio que atraviesa generaciones.",
    director: "Baran bo Odar",
    cast: "Louis Hofmann, Lisa Vicari, Oliver Masucci",
    group: "Netflix",
  },
];
