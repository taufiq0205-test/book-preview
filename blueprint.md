# Book Preview - A 3D Photobook Maker

## Overview

This document outlines the development plan and technical specifications for the "Book Preview" project, a web-based application that allows users to create, preview, and export a personalized 3D photobook. The application will guide users through selecting an orientation, uploading photos, and viewing their creation in an interactive 3D space before generating a print-ready PDF.

## Core Features & Design Principles

*   **Interactive 3D Preview**: Users can flip through the pages of their photobook in a realistic 3D environment.
*   **Dynamic Photo Layout**: Photos are automatically arranged based on a predefined JSON structure, which can be extended with additional pages if more photos are uploaded.
*   **High-Quality PDF Export**: The final photobook can be exported as a high-resolution, print-ready PDF.
*   **Aesthetics**: The application will have a premium, modern design with a focus on user experience. It will be visually balanced, with clean spacing, polished styles, and intuitive navigation.
*   **Accessibility**: The UI will be designed to be accessible to a wide range of users, adhering to a11y standards.

## Technical Specifications

*   **Framework**: Next.js (App Router)
*   **3D Rendering**: React Three Fiber, Drei
*   **Image Storage**: Supabase
*   **Authentication**: Supabase Auth
*   **PDF Generation**: Server-side generation for optimal quality.
*   **Styling**: Tailwind CSS for utility-first styling.

---

## Development Plan

The project will be developed in phases to ensure a structured and iterative workflow.

### **Phase 1: Foundation & Orientation Screen (In Progress)**

1.  **Blueprint Initialization**: Create and maintain this `blueprint.md` file as the single source of truth for the project.
2.  **Dependency Installation**: Install `three`, `@react-three/fiber`, `@react-three/drei`, and `@supabase/supabase-js`.
3.  **UI Development - Orientation Screen**:
    *   Design and build the initial user interface at the root (`/`) of the application.
    *   Present two primary choices: "Landscape" and "Square".
    *   The UI will be modern, responsive, and visually appealing, incorporating iconography and clean design.
4.  **Routing**: Create a new route at `/upload` where users will be directed after selecting their photobook orientation. This page will be built in the next phase.

### **Phase 2: Photo Upload & Management**

1.  **UI Development - Upload Page**: Create the UI for the `/upload` page, including a file input area that accepts multiple images.
2.  **Image Handling**:
    *   Implement client-side validation for image resolution (300 DPI minimum).
    *   Set up Supabase Storage for secure image uploads.
    *   Implement logic to handle photo ordering (by upload time) and page creation (adding new spreads if photos exceed the initial 5-spread limit).

### **Phase 3: 3D Photobook Preview**

1.  **3D Scene Setup**: Create a 3D scene using React Three Fiber.
2.  **Photobook Model**:
    *   Create a 3D model of a photobook with a front cover, back cover, spine, and 5 initial spreads (10 pages).
    *   The pages will be thick, like plywood, with a simple but elegant page-turning animation that includes soft shadows.
3.  **Dynamic Texture Mapping**:
    *   Develop a system to apply the user's uploaded photos as textures onto the pages of the 3D model.
    *   This system will use a simplified version of the provided JSON structure to position the images correctly.

### **Phase 4: PDF Generation & Checkout**

1.  **Server-Side PDF Generation**: Create a server-side function to generate a high-resolution, print-ready PDF of the photobook.
2.  **UI Development - Checkout/Download Page**: Create a final page where the user can confirm their photobook and download the generated PDF.
3.  **Performance Testing**: Conduct performance tests to ensure the PDF generation process is smooth and efficient.

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
