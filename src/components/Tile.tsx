import { parseTile, type Tile as TileType, tileName } from "@/lib/mahjong/tiles";

export function Tile({ tile, small, onClick }: { tile: TileType; small?: boolean; onClick?: () => void }) {
  const { suit } = parseTile(tile);
  const classes = ["tile-chip"];
  if (small) classes.push("small");
  if (suit === "z") classes.push("honor");
  if (suit === "f") classes.push("flower");
  const label = tileName(tile);
  if (onClick) {
    return (
      <button type="button" className={classes.join(" ")} onClick={onClick} title={label}>
        {label}
      </button>
    );
  }
  return <span className={classes.join(" ")} title={label}>{label}</span>;
}
