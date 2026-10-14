
/* ========================================
   SPOKE & COG
   Interactive Features
   ======================================== */

document.addEventListener("DOMContentLoaded", () => {
  // --------------------------------------
  // SELECT ELEMENTS
  // --------------------------------------

  const repairInputs = document.querySelectorAll(
    ".repair-option input[type='checkbox']"
  );

  const tagItems = document.getElementById("tag-items");
  const tagEmpty = document.getElementById("tag-empty");
  const totalElement = document.getElementById("total");
  const notesField = document.getElementById("notes");

  const bookingForm = document.getElementById("book-form");
  const formStatus = document.getElementById("form-status");

  const tagButton = document.getElementById("tag-cta");
  const menuToggle = document.getElementById("menu-toggle");
  const mobileNav = document.getElementById("mobile-nav");

  // --------------------------------------
  // FORMAT CURRENCY
  // --------------------------------------

  function formatPrice(amount) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2
    }).format(amount);
  }

  // --------------------------------------
  // GET SELECTED REPAIRS
  // --------------------------------------

  function getSelectedRepairs() {
    return Array.from(repairInputs)
      .filter((input) => input.checked)
      .map((input) => ({
        name: input.dataset.name,
        price: Number(input.dataset.price)
      }))
      .filter((repair) =>
        repair.name &&
        Number.isFinite(repair.price) &&
        repair.price >= 0
      );
  }

  // --------------------------------------
  // KEEP REPAIR SUMMARY IN SYNC
  // --------------------------------------

  function updateRepairNotes() {
    if (!notesField) return;

    const marker = "[Selected repairs]";
    const currentText = notesField.value;

    // Remove the previous automatically generated summary.
    // Everything the customer typed after it is preserved.
    const markerIndex = currentText.indexOf(marker);

    const customerNotes = (
      markerIndex >= 0
        ? currentText.slice(0, markerIndex)
        : currentText
    ).trim();

    const selectedRepairs = getSelectedRepairs();

    if (selectedRepairs.length === 0) {
      notesField.value = customerNotes;
      return;
    }

    const repairNames = selectedRepairs
      .map((repair) => repair.name)
      .join(", ");

    const summary = `${marker}\n${repairNames}`;

    notesField.value = customerNotes
      ? `${customerNotes}\n\n${summary}`
      : summary;
  }

  // --------------------------------------
  // UPDATE REPAIR TAG
  // --------------------------------------

  function updateRepairTag() {
    if (!tagItems || !tagEmpty || !totalElement) return;

    const selectedRepairs = getSelectedRepairs();

    const total = selectedRepairs.reduce(
      (sum, repair) => sum + repair.price,
      0
    );

    // Clear old list items safely.
    tagItems.replaceChildren();

    // Show the empty message only when nothing is selected.
    tagEmpty.hidden = selectedRepairs.length > 0;

    // Build the selected repair list.
    selectedRepairs.forEach((repair) => {
      const item = document.createElement("li");

      const name = document.createElement("span");
      name.textContent = repair.name;

      const price = document.createElement("span");
      price.textContent = formatPrice(repair.price);

      item.append(name, price);
      tagItems.appendChild(item);
    });

    // Update the total.
    totalElement.textContent = formatPrice(total);

    // Update booking notes without losing customer input.
    updateRepairNotes();

    // Update the accessible description.
    const repairTag = document.querySelector(".repair-tag");

    if (repairTag) {
      repairTag.setAttribute(
        "aria-label",
        selectedRepairs.length > 0
          ? `${selectedRepairs.length} repairs selected. Estimated labor: ${formatPrice(total)}.`
          : "No repairs selected. Estimated labor: $0."
      );
    }
  }

  // Listen for changes to repair checkboxes.
  repairInputs.forEach((input) => {
    input.addEventListener("change", () => {
      updateRepairTag();

      if (formStatus) {
        formStatus.textContent = "";
      }
    });
  });

  // --------------------------------------
  // BOOK THIS REPAIR
  // --------------------------------------

  if (tagButton) {
    tagButton.addEventListener("click", (event) => {
      const selectedRepairs = getSelectedRepairs();

      if (selectedRepairs.length === 0) {
        // Allow booking without selecting a repair,
        // but let the customer know how to get an estimate.
        if (formStatus) {
          formStatus.textContent =
            "You can continue without selecting a repair, or choose a repair for an estimate.";
        }
      } else {
        updateRepairTag();
      }
    });
  }

  // --------------------------------------
  // MOBILE NAVIGATION
  // --------------------------------------

  function closeMobileMenu() {
    if (!menuToggle || !mobileNav) return;

    mobileNav.hidden = true;
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");

    document.body.classList.remove("menu-open");
  }

  if (menuToggle && mobileNav) {
    menuToggle.addEventListener("click", () => {
      const isExpanded =
        menuToggle.getAttribute("aria-expanded") === "true";

      if (isExpanded) {
        closeMobileMenu();
      } else {
        mobileNav.hidden = false;

        menuToggle.setAttribute("aria-expanded", "true");
        menuToggle.setAttribute("aria-label", "Close navigation");

        document.body.classList.add("menu-open");
      }
    });

    // Close the menu after selecting a destination.
    mobileNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMobileMenu);
    });

    // Close the menu with the Escape key.
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMobileMenu();
      }
    });

    // Close the menu when returning to desktop width.
    window.addEventListener("resize", () => {
      if (window.innerWidth > 650) {
        closeMobileMenu();
      }
    });
  }

  // --------------------------------------
  // BOOKING FORM VALIDATION
  // --------------------------------------

  if (bookingForm && formStatus) {
    bookingForm.addEventListener("submit", (event) => {
      event.preventDefault();

      formStatus.textContent = "";

      // Use built-in browser validation.
      if (!bookingForm.checkValidity()) {
        bookingForm.reportValidity();

        formStatus.textContent =
          "Please complete the required fields.";

        return;
      }

      const formData = new FormData(bookingForm);

      const name = String(
        formData.get("name") || ""
      ).trim();

      const phone = String(
        formData.get("phone") || ""
      ).trim();

      const bikeType = String(
        formData.get("bikeType") || ""
      ).trim();

      if (!name || !phone) {
        formStatus.textContent =
          "Please enter your name and phone number.";

        return;
      }

      const selectedRepairs = getSelectedRepairs();

      const total = selectedRepairs.reduce(
        (sum, repair) => sum + repair.price,
        0
      );

      // This is a demonstration, not a real booking.
      const message = selectedRepairs.length > 0
        ? `Selected repairs: ${selectedRepairs.map((repair) => repair.name).join(", ")}. Estimated labor: ${formatPrice(total)}.`
        : "No repairs selected yet.";

      formStatus.textContent =
        `Thanks, ${name}! Your form passed validation. ` +
        `${bikeType ? `Bike: ${bikeType}. ` : ""}` +
        `${message} This is a demo; your request has not been sent.`;
    });
  }

  // --------------------------------------
  // INITIALIZE
  // --------------------------------------

  updateRepairTag();
});
