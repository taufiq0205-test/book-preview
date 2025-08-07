# Book Preview - A 2D Photobook Maker

## Overview

This document outlines the development plan and technical specifications for the "Book Preview" project, a web-based application that allows users to create, preview, and export a personalized 2D photobook. The application will guide users through selecting an orientation, uploading photos, and viewing their creation in an interactive 2D space before generating a print-ready PDF.

## Core Features & Design Principles

*   **Interactive 2D Preview**: Users can flip through the pages of their photobook in a simple, intuitive 2D interface.
*   **Dynamic Photo Layout**: Photos are automatically arranged based on a predefined JSON structure, which can be extended with additional pages if more photos are uploaded.
*   **High-Quality PDF Export**: The final photobook can be exported as a high-resolution, print-ready PDF.
*   **Aesthetics**: The application will have a premium, modern design with a focus on user experience. It will be visually balanced, with clean spacing, polished styles, and intuitive navigation.
*   **Accessibility**: The UI will be designed to be accessible to a wide range of users, adhering to a11y standards.

## Technical Specifications

*   **Framework**: Next.js (App Router)
*   **Image Storage**: Supabase
*   **Authentication**: Supabase Auth
*   **PDF Generation**: Server-side generation for optimal quality.
*   **Styling**: Tailwind CSS for utility-first styling.

---

## Development Plan

The project will be developed in phases to ensure a structured and iterative workflow.

### **Phase 1: Foundation & Orientation Screen (Completed)**

1.  **Blueprint Initialization**: Create and maintain this `blueprint.md` file as the single source of truth for the project.
2.  **Dependency Installation**: Install `@supabase/supabase-js`.
3.  **UI Development - Orientation Screen**:
    *   Design and build the initial user interface at the root (`/`) of the application.
    *   Present two primary choices: "Landscape" and "Square".
    *   The UI will be modern, responsive, and visually appealing, incorporating iconography and clean design.
4.  **Routing**: Create a new route at `/upload` where users will be directed after selecting their photobook orientation.

### **Phase 2: Photo Upload & Management (Completed)**

1.  **UI Development - Upload Page**: Create the UI for the `/upload` page, including a file input area that accepts multiple images.
2.  **Image Handling**:
    *   Implemented Supabase Storage for secure image uploads and retrieval.
    *   Implemented client-side validation for image resolution.
    *   Implemented image upscaling with UpscalerJS.
    *   Implemented logic to handle photo ordering and page creation.

### **Phase 3: 2D Photobook Preview (In Progress)**

1.  **UI Development - Preview Page**:
    *   Create a two-page spread layout using standard HTML and CSS.
    *   The layout will dynamically adjust to "Landscape" or "Square" orientations based on the URL query parameter.
2.  **Image Display**:
    *   Fetch the uploaded image URLs from Supabase.
    *   Display the images on the corresponding pages of the 2D book view.
3.  **Navigation**:
    *   Implement "Previous" and "Next" buttons to allow users to navigate through the pages of the photobook.

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
