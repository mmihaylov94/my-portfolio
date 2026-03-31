#!/usr/bin/env python3
"""
Generate responsive image variants for files in /public.

Creates sibling files with suffixes:
  -480w, -768w, -1200w

Example:
  public/profile_picture.jpg
  -> public/profile_picture-480w.jpg
  -> public/profile_picture-768w.jpg
  -> public/profile_picture-1200w.jpg

Usage:
  python scripts/resize_public_images.py
  python scripts/resize_public_images.py --public-dir public --widths 480 768 1200
  python scripts/resize_public_images.py --dry-run
"""

from __future__ import annotations

import argparse
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from PIL import Image
import re


SUPPORTED_EXTS = {".jpg", ".jpeg", ".png", ".webp"}
VARIANT_RE = re.compile(r".*-\d+w$", re.IGNORECASE)


@dataclass(frozen=True)
class ResizePlan:
	src: Path
	dst: Path
	width: int


def is_variant_file(path: Path, widths: Iterable[int]) -> bool:
	# Ignore any previously generated responsive variant, regardless of widths.
	return bool(VARIANT_RE.match(path.stem))


def iter_source_images(public_dir: Path, widths: list[int]) -> list[Path]:
	paths: list[Path] = []
	for p in public_dir.rglob("*"):
		if not p.is_file():
			continue
		if p.suffix.lower() not in SUPPORTED_EXTS:
			continue
		if is_variant_file(p, widths):
			continue
		paths.append(p)
	return sorted(paths)


def build_plans(src: Path, widths: list[int]) -> list[ResizePlan]:
	plans: list[ResizePlan] = []
	for w in widths:
		dst = src.with_name(f"{src.stem}-{w}w{src.suffix.lower()}")
		plans.append(ResizePlan(src=src, dst=dst, width=w))
	return plans


def should_generate(src_width: int, plan: ResizePlan) -> bool:
	# Don't upscale.
	return src_width >= plan.width


def save_resized(img: Image.Image, dst: Path) -> None:
	dst.parent.mkdir(parents=True, exist_ok=True)
	ext = dst.suffix.lower()

	if ext in {".jpg", ".jpeg"}:
		img.save(dst, format="JPEG", quality=82, optimize=True, progressive=True)
		return
	if ext == ".png":
		img.save(dst, format="PNG", optimize=True)
		return
	if ext == ".webp":
		img.save(dst, format="WEBP", quality=82, method=6)
		return

	raise ValueError(f"Unsupported output extension: {ext}")


def process_image(src: Path, widths: list[int], overwrite: bool, dry_run: bool) -> tuple[int, int]:
	created = 0
	skipped = 0

	with Image.open(src) as im0:
		im = im0.convert("RGBA") if src.suffix.lower() in {".png", ".webp"} else im0.convert("RGB")
		src_w, src_h = im.size

		for plan in build_plans(src, widths):
			if not should_generate(src_w, plan):
				skipped += 1
				continue

			if plan.dst.exists() and not overwrite:
				skipped += 1
				continue

			new_h = round(src_h * (plan.width / src_w))
			if dry_run:
				created += 1
				continue

			resized = im.resize((plan.width, new_h), resample=Image.Resampling.LANCZOS)
			save_resized(resized, plan.dst)
			created += 1

	return created, skipped


def main() -> int:
	parser = argparse.ArgumentParser()
	parser.add_argument("--public-dir", default="public", help="Path to the public directory")
	parser.add_argument("--widths", nargs="+", type=int, default=[480, 768, 1200], help="Variant widths in px")
	parser.add_argument("--overwrite", action="store_true", help="Overwrite existing variants")
	parser.add_argument("--dry-run", action="store_true", help="Print what would be done without writing files")
	args = parser.parse_args()

	public_dir = Path(args.public_dir).resolve()
	widths = sorted(set(args.widths))

	if not public_dir.exists():
		raise SystemExit(f"Public dir not found: {public_dir}")

	sources = iter_source_images(public_dir, widths)
	if not sources:
		print(f"No source images found in {public_dir}")
		return 0

	total_created = 0
	total_skipped = 0

	for src in sources:
		created, skipped = process_image(src, widths, overwrite=args.overwrite, dry_run=args.dry_run)
		total_created += created
		total_skipped += skipped
		print(f"{src.relative_to(public_dir)}: +{created} / ~{skipped}")

	print(f"Done. Created {total_created} variants; skipped {total_skipped}.")
	if args.dry_run:
		print("Dry run only (no files written).")
	return 0


if __name__ == "__main__":
	raise SystemExit(main())

