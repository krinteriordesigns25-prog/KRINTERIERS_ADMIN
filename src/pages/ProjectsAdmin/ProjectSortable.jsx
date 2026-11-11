import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { projectApi, getProjectImageUrl } from "../../projectApi.js";

export function SortableSection({ id, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`sortable-section ${isDragging ? "dragging" : ""}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <button
        type="button"
        className="drag-handle"
        {...attributes}
        {...listeners}
        aria-label="Drag section"
      >
        ⠿
      </button>

      {children}
    </div>
  );
}

export function SortableImage({ id, image, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`sortable-image ${isDragging ? "dragging" : ""}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <img src={getProjectImageUrl(image)} alt="Project" />

      <button
        type="button"
        className="image-drag-handle"
        {...attributes}
        {...listeners}
        aria-label="Drag image"
      >
        ⠿
      </button>

      <button
        type="button"
        className="image-remove"
        onClick={onRemove}
        aria-label="Remove image"
      >
        ×
      </button>
    </div>
  );
}
