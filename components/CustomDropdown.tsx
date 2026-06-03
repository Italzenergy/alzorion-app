"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./customDropdown.module.css";

interface Option {
  label: string;
  value: any;
  stock?: number; // opcional (solo para productos)
}

interface Props {
  options: Option[];
  value: any;
  onChange: (val: any) => void;
  placeholder?: string;
  searchable?: boolean;
}

export default function CustomDropdown({
  options,
  value,
  onChange,
  placeholder = "Seleccionar",
  searchable = false
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement | null>(null);

  const selected = options.find(o => o.value === value);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  // 🔥 click outside (PRO)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={styles.container} ref={ref}>
      {/* CONTROL */}
      <div className={styles.control} onClick={() => setOpen(!open)}>
        {selected?.label || placeholder}
        <span className={styles.arrow}>▾</span>
      </div>

      {/* DROPDOWN */}
      {open && (
        <div className={styles.dropdown}>
          {searchable && (
            <input
              className={styles.search}
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          )}

          {filtered.length > 0 ? (
            filtered.map((opt, i) => (
              <div
                key={i}
                className={styles.option}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                  setSearch("");
                }}
              >
                <div className={styles.optionContent}>
                  <span>{opt.label}</span>

                  {/* 👇 SOLO SI TIENE STOCK */}
                  {opt.stock !== undefined && (
                    <span
                      className={`${styles.stock} ${
                        opt.stock === 0 ? styles.noStock : ""
                      }`}
                    >
                      {opt.stock === 0 ? "Sin stock" : `Stock: ${opt.stock}`}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className={styles.noResults}>Sin resultados</div>
          )}
        </div>
      )}
    </div>
  );
}