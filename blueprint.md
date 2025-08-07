# Book Preview - A 2D Photobook Maker

## Overview

This document outlines the development plan and technical specifications for the "Book Preview" project, a web-based application that allows users to create, preview, and export a personalized 2D photobook. The application will guide users through selecting an orientation, uploading photos, and viewing their creation in an interactive 2D space before generating a print-ready PDF.

## Core Features & Design Principles

*   **Interactive 2D Preview**: Users can flip through the pages of their photobook with a realistic page-turning animation.
*   **Dynamic Photo Layout**: Photos are automatically arranged based on a predefined JSON structure, which can be extended with additional pages if more photos are uploaded.
*   **High-Quality PDF Export**: The final photobook can be exported as a high-resolution, print-ready PDF.
*   **Aesthetics**: The application will have a premium, modern design with a focus on user experience. It will be visually balanced, with clean spacing, polished styles, and intuitive navigation.
*   **Accessibility**: The UI will be designed to be accessible to a wide range of users, adhering to a11y standards.

## Technical Specifications

*   **Framework**: Next.js (App Router)
*   **Image Storage**: Supabase
*   **Styling**: Tailwind CSS
*   **Page-Flip Animation**: react-pageflip

---

## Development Plan

The project will be developed in phases to ensure a structured and iterative workflow.

### **Phase 1: Foundation & Orientation Screen (Completed)**

1.  **Blueprint Initialization**: Create and maintain this `blueprint.md` file as the single source of truth for the project.
2.  **Dependency Installation**: Install `@supabase/supabase-js`.
3.  **UI Development - Orientation Screen**:
    *   Design and build the initial user interface at the root (`/`) of the application.
    *   Present two primary choices: "Landscape" and "Square".
4.  **Routing**: Create a new route at `/upload`.

### **Phase 2: Photo Upload & Management (Completed)**

1.  **UI Development - Upload Page**: Create a structured UI with distinct inputs for the front cover, back cover, and 8 page photos.
2.  **Image Handling**:
    *   Implemented Supabase Storage with systematic naming (`cover_front.jpg`, `cover_back.jpg`, `page_1.jpg`, etc.).
    *   Implemented client-side validation for image resolution and an optional upscaler.

### **Phase 3: 2D Photobook Preview (In Progress)**

1.  **UI Development - Preview Page**:
    *   Integrate the `react-pageflip` library to create an interactive book component.
    *   The layout will dynamically adjust to "Landscape" or "Square" orientations.
2.  **Image Display**:
    *   Fetch the uploaded image URLs from Supabase based on their precise filenames.
    *   Display the images on the corresponding pages of the flipbook (front cover, pages 1-8, back cover).
3.  **Navigation**:
    *   Users can click and drag to turn pages.
    *   "Previous" and "Next" buttons will also be connected to the flipbook's API to turn pages programmatically.

### **Phase 4: PDF Generation & Checkout**

1.  **PDF Generation**: Implement client-side PDF generation using `jsPDF`.
2.  **UI Development - Download Button**: Create a button to trigger the PDF export.

---

## Simplified JSON Layout Structure

For the prototype, we will use a simplified JSON structure to define the layout of photos on each page.

```json
{
  "pages": [
    {
      "pageNumber": 1,
      "elements": [
        { "type": "image", "x": 50, "y": 50, "width": 400, "height": 300 }
      ]
    },
    {
      "pageNumber": 2,
      "elements": [
        { "type": "image", "x": 150, "y": 50, "width": 400, "height": 300 }
      ]
    }
  ]
}
```
