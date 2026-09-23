(function () {
  "use strict";

  /* ===========================================================
     BASIC SETTINGS
     =========================================================== */

  const API_BASE = window.AIMT_API_BASE || "/api";

  const prefersReducedMotion =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;


  /* ===========================================================
     PRELOADER
     =========================================================== */

  const preloader = document.getElementById("preloader");

  window.addEventListener("load", () => {
    setTimeout(() => {
      if (preloader) {
        preloader.classList.add("is-done");
      }

    }, 500);
  });


  /* ===========================================================
     LOCAL STORAGE
     =========================================================== */

  /* ===========================================================
   BACKEND COMPLAINT API
   =========================================================== */

const STORE_KEY = "aimt_complaints_v1";

let backendComplaints = [];
let complaintsLoading = false;


/* ===========================================================
   GET STUDENT COMPLAINTS
   =========================================================== */

async function fetchMyComplaints() {

    const token = getAuthToken();

    if (!token) {
        backendComplaints = [];
        return [];
    }

    try {

        complaintsLoading = true;

        const response = await fetch(
            `${API_BASE}/complaints/my`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Failed to load complaints."
            );
        }

        backendComplaints =
            Array.isArray(data.complaints)
                ? data.complaints
                : [];

        return backendComplaints;

    } catch (error) {

        console.error(
            "❌ Fetch Complaints Error:",
            error
        );

        showToast(
            "Unable to load your complaints."
        );

        backendComplaints = [];

        return [];

    } finally {

        complaintsLoading = false;

    }
}


/* ===========================================================
   LOAD COMPLAINTS
   =========================================================== */

function loadComplaints() {
    return backendComplaints;
}


/* ===========================================================
   SAVE COMPLAINTS
   =========================================================== */

function saveComplaints(list) {

    /*
      Complaints are now stored in MongoDB.
      This function is kept only so existing
      frontend code does not break.
    */

    backendComplaints =
        Array.isArray(list)
            ? list
            : [];

}


/* ===========================================================
   MAKE TICKET ID
   =========================================================== */

function makeTicketId(date) {

    const year =
        date.getFullYear();

    const rand =
        Math.floor(
            1000 +
            Math.random() * 9000
        );

    return `AIMT-${year}-${rand}`;
}

  /* ===========================================================
     STATUS
     =========================================================== */

  const STATUS_STEPS = [
    "Submitted",
    "Under Review",
    "In Progress",
    "Resolved"
  ];


  /* ===========================================================
     ROUTING ENGINE
     =========================================================== */

  const ROUTING_RULES = [
    {
      category: "Academics",
      words: [
        "exam",
        "marks",
        "grade",
        "result",
        "syllabus",
        "attendance",
        "revaluation",
        "assignment",
        "paper",
        "lecture",
        "class",
        "timetable"
      ]
    },

    {
      category: "Hostel",
      words: [
        "hostel",
        "warden",
        "room",
        "roommate",
        "accommodation",
        "bed",
        "curfew"
      ]
    },

    {
      category: "Canteen",
      words: [
        "mess",
        "canteen",
        "food",
        "meal",
        "kitchen",
        "hygiene",
        "stale",
        "cook"
      ]
    },

    {
      category: "Infrastructure",
      words: [
        "wifi",
        "internet",
        "electricity",
        "power",
        "washroom",
        "toilet",
        "lab",
        "equipment",
        "projector",
        "lift",
        "building",
        "ac",
        "fan",
        "leak",
        "water",
        "furniture"
      ]
    },

    {
      category: "Faculty",
      words: [
        "professor",
        "teacher",
        "faculty",
        "lecturer",
        "teaching",
        "biased",
        "favoritism"
      ]
    },

    {
      category: "Fees",
      words: [
        "fee",
        "fees",
        "admission",
        "certificate",
        "transcript",
        "scholarship",
        "refund"
      ]
    },

    {
      category: "Transport",
      words: [
        "bus",
        "transport",
        "driver",
        "route",
        "van",
        "pickup",
        "drop"
      ]
    }
  ];


  function suggestCategory(text) {

    const lower = text.toLowerCase();

    let best = null;
    let bestScore = 0;

    ROUTING_RULES.forEach((rule) => {

      let score = 0;

      rule.words.forEach((word) => {

        if (lower.includes(word)) {
          score++;
        }

      });

      if (score > bestScore) {
        bestScore = score;
        best = rule.category;
      }

    });

    if (!best) {
      return null;
    }

    const confidence =
      Math.min(96, 52 + bestScore * 14);

    return {
      category: best,
      confidence
    };
  }


  /* ===========================================================
     PARTICLES
     =========================================================== */

  const particleCanvas =
    document.getElementById("particleCanvas");

  if (
    particleCanvas &&
    !prefersReducedMotion
  ) {

    const ctx =
      particleCanvas.getContext("2d");

    let particles = [];

    let w;
    let h;


    function resizeCanvas() {

      w = particleCanvas.width =
        window.innerWidth;

      h = particleCanvas.height =
        window.innerHeight;
    }


    function initParticles() {

      const count =
        Math.min(
          60,
          Math.floor(
            (w * h) / 26000
          )
        );


      particles =
        Array.from(
          { length: count },
          () => ({
            x: Math.random() * w,
            y: Math.random() * h,
            r: 0.6 + Math.random() * 1.8,
            vy: 0.12 + Math.random() * 0.28,
            vx: (Math.random() - 0.5) * 0.15,
            alpha: 0.15 + Math.random() * 0.35
          })
        );
    }


    function tick() {

      ctx.clearRect(
        0,
        0,
        w,
        h
      );


      particles.forEach((p) => {

        p.y -= p.vy;
        p.x += p.vx;


        if (p.y < -10) {

          p.y = h + 10;
          p.x = Math.random() * w;

        }


        ctx.beginPath();

        ctx.fillStyle =
          `rgba(201,162,39,${p.alpha})`;

        ctx.arc(
          p.x,
          p.y,
          p.r,
          0,
          Math.PI * 2
        );

        ctx.fill();

      });


      requestAnimationFrame(tick);
    }


    resizeCanvas();
    initParticles();
    requestAnimationFrame(tick);


    window.addEventListener(
      "resize",
      () => {
        resizeCanvas();
        initParticles();
      }
    );
  }


  /* ===========================================================
     TICKER
     =========================================================== */

  const tickerMessages = [
    "Grievance Cell now routes complaints automatically",
    "Median resolution time this term: 2–4 working days",
    "Anonymous filing available for every category",
    "Urgent complaints are flagged for same-day review",
    "Track any ticket instantly with your complaint number"
  ];


  const tickerTrack =
    document.getElementById("tickerTrack");


  if (tickerTrack) {

    const doubled =
      tickerMessages.concat(
        tickerMessages
      );

    tickerTrack.innerHTML =
      doubled
        .map(
          (message) =>
            `<span>${message}</span>`
        )
        .join("");
  }


  /* ===========================================================
     HEADER
     =========================================================== */

  const siteHeader =
    document.getElementById("siteHeader");

  const backToTop =
    document.getElementById("backToTop");


  window.addEventListener(
    "scroll",
    () => {

      const y =
        window.scrollY;


      if (siteHeader) {

        siteHeader.classList.toggle(
          "is-scrolled",
          y > 30
        );

      }


      if (backToTop) {

        backToTop.classList.toggle(
          "is-visible",
          y > 500
        );

      }

    },
    {
      passive: true
    }
  );


  if (backToTop) {

    backToTop.addEventListener(
      "click",
      () => {

        window.scrollTo({
          top: 0,
          behavior:
            prefersReducedMotion
              ? "auto"
              : "smooth"
        });

      }
    );
  }


  /* ===========================================================
     MOBILE NAV
     =========================================================== */

  const navToggle =
    document.getElementById("navToggle");

  const headerInner =
    document.querySelector(".header-inner");


  if (navToggle && headerInner) {

    navToggle.addEventListener(
      "click",
      () => {

        const isOpen =
          headerInner.classList.toggle(
            "is-open"
          );

        navToggle.setAttribute(
          "aria-expanded",
          String(isOpen)
        );

      }
    );


    document
      .querySelectorAll(".main-nav a")
      .forEach((link) => {

        link.addEventListener(
          "click",
          () => {

            headerInner.classList.remove(
              "is-open"
            );

            navToggle.setAttribute(
              "aria-expanded",
              "false"
            );

          }
        );

      });
  }


  /* ===========================================================
     HERO WORD
     =========================================================== */

  const cycleWords = [
    "Academics",
    "Hostel life",
    "Mess food",
    "Faculty issues",
    "Campus infra",
    "Fees & admin"
  ];


  const cycleWordEl =
    document.getElementById(
      "cycleWord"
    );


  if (
    cycleWordEl &&
    !prefersReducedMotion
  ) {

    let idx = 0;

    setInterval(
      () => {

        idx =
          (idx + 1) %
          cycleWords.length;


        cycleWordEl.style.opacity =
          "0";


        setTimeout(
          () => {

            cycleWordEl.textContent =
              cycleWords[idx];

            cycleWordEl.style.opacity =
              "1";

          },
          220
        );

      },
      2400
    );


    cycleWordEl.style.transition =
      "opacity 0.22s ease";
  }


  /* ===========================================================
     MAGNETIC BUTTONS
     =========================================================== */

  if (
    !prefersReducedMotion &&
    window.matchMedia(
      "(pointer:fine)"
    ).matches
  ) {

    document
      .querySelectorAll(".magnetic")
      .forEach((btn) => {

        btn.addEventListener(
          "mousemove",
          (e) => {

            const rect =
              btn.getBoundingClientRect();

            const relX =
              e.clientX -
              rect.left -
              rect.width / 2;

            const relY =
              e.clientY -
              rect.top -
              rect.height / 2;


            btn.style.transform =
              `translate(
                ${relX * 0.18}px,
                ${relY * 0.28}px
              )`;
          }
        );


        btn.addEventListener(
          "mouseleave",
          () => {

            btn.style.transform =
              "";

          }
        );

      });
  }


  /* ===========================================================
     TILT CARDS
     =========================================================== */

  if (
    !prefersReducedMotion &&
    window.matchMedia(
      "(pointer:fine)"
    ).matches
  ) {

    document
      .querySelectorAll(".tilt-card")
      .forEach((card) => {

        card.addEventListener(
          "mousemove",
          (e) => {

            const rect =
              card.getBoundingClientRect();


            const px =
              (e.clientX - rect.left) /
                rect.width -
              0.5;


            const py =
              (e.clientY - rect.top) /
                rect.height -
              0.5;


            card.style.transform =
              `perspective(600px)
               rotateX(${py * -6}deg)
               rotateY(${px * 8}deg)
               translateY(-2px)`;

          }
        );


        card.addEventListener(
          "mouseleave",
          () => {

            card.style.transform =
              "";

          }
        );

      });
  }


  /* ===========================================================
     SCROLL REVEAL
     =========================================================== */

  const revealEls =
    document.querySelectorAll(
      ".reveal"
    );


  if (
    "IntersectionObserver" in window &&
    !prefersReducedMotion
  ) {

    const io =
      new IntersectionObserver(
        (entries) => {

          entries.forEach(
            (entry) => {

              if (
                entry.isIntersecting
              ) {

                entry.target.classList.add(
                  "is-visible"
                );

                io.unobserve(
                  entry.target
                );

              }

            }
          );

        },
        {
          threshold: 0.15,
          rootMargin:
            "0px 0px -60px 0px"
        }
      );


    revealEls.forEach(
      (el) => io.observe(el)
    );

  } else {

    revealEls.forEach(
      (el) =>
        el.classList.add(
          "is-visible"
        )
    );

  }


  /* ===========================================================
     TOAST
     =========================================================== */

  const toastEl =
    document.getElementById("toast");

  let toastTimer = null;


  function showToast(message) {

    if (!toastEl) return;


    toastEl.textContent =
      message;


    toastEl.classList.add(
      "is-visible"
    );


    clearTimeout(toastTimer);


    toastTimer =
      setTimeout(
        () => {

          toastEl.classList.remove(
            "is-visible"
          );

        },
        3800
      );
  }


  /* ===========================================================
     CONFETTI
     =========================================================== */

  const confettiCanvas =
    document.getElementById(
      "confettiCanvas"
    );


  function burstConfetti() {

    if (
      !confettiCanvas ||
      prefersReducedMotion
    ) {
      return;
    }


    const ctx =
      confettiCanvas.getContext(
        "2d"
      );


    confettiCanvas.width =
      window.innerWidth;

    confettiCanvas.height =
      window.innerHeight;


    const colors = [
      "#B01F2E",
      "#C9A227",
      "#E4C158",
      "#142451",
      "#FBF8F0"
    ];


    const pieces =
      Array.from(
        { length: 140 },
        () => ({

          x:
            confettiCanvas.width /
              2 +
            (Math.random() - 0.5) *
              200,

          y:
            confettiCanvas.height *
            0.35,

          vx:
            (Math.random() - 0.5) *
            12,

          vy:
            -Math.random() * 10 -
            4,

          size:
            5 +
            Math.random() * 6,

          color:
            colors[
              Math.floor(
                Math.random() *
                  colors.length
              )
            ],

          rot:
            Math.random() * 360,

          vr:
            (Math.random() - 0.5) *
            14,

          gravity:
            0.32 +
            Math.random() * 0.12

        })
      );


    let frame = 0;


    function animate() {

      frame++;


      ctx.clearRect(
        0,
        0,
        confettiCanvas.width,
        confettiCanvas.height
      );


      let alive = false;


      pieces.forEach((p) => {

        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;


        if (
          p.y <
          confettiCanvas.height +
            40
        ) {
          alive = true;
        }


        ctx.save();

        ctx.translate(
          p.x,
          p.y
        );

        ctx.rotate(
          (p.rot * Math.PI) /
            180
        );


        ctx.fillStyle =
          p.color;


        ctx.fillRect(
          -p.size / 2,
          -p.size / 2,
          p.size,
          p.size * 0.6
        );


        ctx.restore();

      });


      if (
        alive &&
        frame < 220
      ) {

        requestAnimationFrame(
          animate
        );

      } else {

        ctx.clearRect(
          0,
          0,
          confettiCanvas.width,
          confettiCanvas.height
        );

      }
    }


    requestAnimationFrame(
      animate
    );
  }


  /* ===========================================================
     ANONYMOUS
     =========================================================== */

  const anonToggle =
    document.getElementById(
      "anonToggle"
    );

  const idFields =
    document.getElementById(
      "idFields"
    );


  if (
    anonToggle &&
    idFields
  ) {

    anonToggle.addEventListener(
      "change",
      () => {

        idFields.style.display =
          anonToggle.checked
            ? "none"
            : "grid";

      }
    );

  }


  /* ===========================================================
     COMPLAINT ROUTING
     =========================================================== */

  const descriptionEl =
    document.getElementById(
      "description"
    );

  const charCountEl =
    document.getElementById(
      "charCount"
    );

  const assistValueEl =
    document.getElementById(
      "assistValue"
    );

  const assistConfEl =
    document.getElementById(
      "assistConf"
    );

  const assistBarFill =
    document.getElementById(
      "assistBarFill"
    );

  const assistCard =
    document.getElementById(
      "assistCard"
    );

  const categorySelect =
    document.getElementById(
      "category"
    );


  let userPickedCategory =
    false;


  if (categorySelect) {

    categorySelect.addEventListener(
      "change",
      () => {

        userPickedCategory =
          categorySelect.value !== "";

      }
    );

  }


  if (descriptionEl) {

    descriptionEl.addEventListener(
      "input",
      () => {

        if (charCountEl) {

          charCountEl.textContent =
            String(
              descriptionEl.value.length
            );

        }


        if (
          descriptionEl.value
            .trim()
            .length < 12
        ) {

          if (assistValueEl) {

            assistValueEl.textContent =
              "Start typing below…";

          }


          if (assistConfEl) {

            assistConfEl.textContent =
              "";

          }


          if (assistBarFill) {

            assistBarFill.style.width =
              "0%";

          }


          if (assistCard) {

            assistCard.classList.remove(
              "is-active"
            );

          }

          return;
        }


        const suggestion =
          suggestCategory(
            descriptionEl.value
          );


        if (suggestion) {

          if (assistValueEl) {

            assistValueEl.textContent =
              suggestion.category;

          }


          if (assistConfEl) {

            assistConfEl.textContent =
              `${suggestion.confidence}% match, based on what you've written`;

          }


          if (assistBarFill) {

            assistBarFill.style.width =
              suggestion.confidence +
              "%";

          }


          if (assistCard) {

            assistCard.classList.add(
              "is-active"
            );

          }

        } else {

          if (assistValueEl) {

            assistValueEl.textContent =
              "No strong match yet — keep going, or choose one yourself";

          }


          if (assistConfEl) {

            assistConfEl.textContent =
              "";

          }


          if (assistBarFill) {

            assistBarFill.style.width =
              "18%";

          }


          if (assistCard) {

            assistCard.classList.remove(
              "is-active"
            );

          }

        }

      }
    );

  }


  /* ===========================================================
     FILE INPUT
     =========================================================== */

  const fileInput =
    document.getElementById(
      "attachment"
    );

  const fileDropLabel =
    document.getElementById(
      "fileDropLabel"
    );

  const fileDrop =
    document.getElementById(
      "fileDrop"
    );


  if (
    fileInput &&
    fileDropLabel &&
    fileDrop
  ) {

    fileInput.addEventListener(
      "change",
      () => {

        fileDropLabel.textContent =
          fileInput.files.length
            ? fileInput.files[0].name
            : "Click to choose a file, or drag one here";

      }
    );


    ["dragover", "dragleave", "drop"]
      .forEach((evt) => {

        fileDrop.addEventListener(
          evt,
          (e) => {

            e.preventDefault();

            fileDrop.classList.toggle(
              "is-dragover",
              evt === "dragover"
            );

          }
        );

      });

  }


  /* ===========================================================
     COMPLAINT SUBMISSION
     =========================================================== */

  const form =
    document.getElementById(
      "complaintForm"
    );

  let lastAddedId = null;


  if (form) {

    form.addEventListener(
      "submit",
      (e) => {

        e.preventDefault();


        const isAnon =
          anonToggle &&
          anonToggle.checked;


        const description =
          descriptionEl.value.trim();


        const category =
          categorySelect.value ||
          "Other";


        if (!description) {

          showToast(
            "Tell us what happened before submitting."
          );

          descriptionEl.focus();

          return;
        }


        const now =
          new Date();


        const complaint = {

          id:
            makeTicketId(now),

          filedAt:
            now.toISOString(),

          anonymous:
            !!isAnon,

          name:
            isAnon
              ? "Anonymous"
              : (
                  document
                    .getElementById(
                      "fullName"
                    )
                    .value
                    .trim() ||
                  "Anonymous"
                ),

          rollNo:
            isAnon
              ? ""
              : document
                  .getElementById(
                    "rollNo"
                  )
                  .value
                  .trim(),

          department:
            isAnon
              ? ""
              : document
                  .getElementById(
                    "deptSelect"
                  )
                  .value,

          contact:
            isAnon
              ? ""
              : document
                  .getElementById(
                    "contact"
                  )
                  .value
                  .trim(),

          category,

          priority:
            document
              .getElementById(
                "priority"
              )
              .value,

          description,

          hasAttachment:
            !!(
              fileInput &&
              fileInput.files.length
            ),

          status:
            "Submitted"

        };


        const list =
          loadComplaints();


        list.unshift(
          complaint
        );


        saveComplaints(
          list
        );


        lastAddedId =
          complaint.id;


        form.reset();


        if (idFields) {

          idFields.style.display =
            "grid";

        }


        if (charCountEl) {

          charCountEl.textContent =
            "0";

        }


        if (assistValueEl) {

          assistValueEl.textContent =
            "Start typing below…";

        }


        if (assistConfEl) {

          assistConfEl.textContent =
            "";

        }


        if (assistBarFill) {

          assistBarFill.style.width =
            "0%";

        }


        if (assistCard) {

          assistCard.classList.remove(
            "is-active"
          );

        }


        if (fileDropLabel) {

          fileDropLabel.textContent =
            "Click to choose a file, or drag one here";

        }


        userPickedCategory =
          false;


        showToast(
          `Filed. Your ticket number is ${complaint.id} — save it to track progress.`
        );


        burstConfetti();

        renderStats();

        renderBoard();

        populateCategoryFilter();


        const trackInput =
          document.getElementById(
            "trackInput"
          );


        if (trackInput) {

          trackInput.value =
            complaint.id;

        }

      }
    );

  }


  /* ===========================================================
     STATS
     =========================================================== */

  function animateCount(
    el,
    target
  ) {

    if (!el) return;


    const start =
      parseInt(
        el.getAttribute(
          "data-count"
        ) || "0",
        10
      );


    if (start === target) {

      el.textContent =
        String(target);

      return;

    }


    if (prefersReducedMotion) {

      el.textContent =
        String(target);

      el.setAttribute(
        "data-count",
        String(target)
      );

      return;

    }


    const duration =
      600;

    const startTime =
      performance.now();


    function step(now) {

      const progress =
        Math.min(
          1,
          (now - startTime) /
            duration
        );


      const eased =
        1 -
        Math.pow(
          1 - progress,
          3
        );


      const value =
        Math.round(
          start +
          (target - start) *
            eased
        );


      el.textContent =
        String(value);


      if (
        progress < 1
      ) {

        requestAnimationFrame(
          step
        );

      } else {

        el.setAttribute(
          "data-count",
          String(target)
        );

      }

    }


    requestAnimationFrame(
      step
    );
  }


  function renderStats() {

    const list =
      loadComplaints();


    const total =
      list.length;


    const resolved =
      list.filter(
        (c) =>
          c.status ===
          "Resolved"
      ).length;


    const inProgress =
      list.filter(
        (c) =>
          c.status ===
            "In Progress" ||
          c.status ===
            "Under Review"
      ).length;


    animateCount(
      document.getElementById(
        "statTotal"
      ),
      total
    );


    animateCount(
      document.getElementById(
        "statResolved"
      ),
      resolved
    );


    animateCount(
      document.getElementById(
        "statProgress"
      ),
      inProgress
    );


    const statTime =
      document.getElementById(
        "statTime"
      );


    if (statTime) {

      statTime.textContent =
        resolved > 0
          ? "2–4 days"
          : "—";

    }

  }


  /* ===========================================================
     TRACK COMPLAINT
     =========================================================== */

  const trackForm =
    document.getElementById(
      "trackForm"
    );

  const trackResult =
    document.getElementById(
      "trackResult"
    );


  function renderTrackResult(id) {

    if (!trackResult) return;


    const list =
      loadComplaints();


    const found =
      list.find(
        (c) =>
          c.id.toLowerCase() ===
          id
            .trim()
            .toLowerCase()
      );


    trackResult.hidden =
      false;


    if (!found) {

      trackResult.className =
        "track-result is-error";


      trackResult.innerHTML =
        `<p>No complaint found with ticket <strong>${escapeHtml(id)}</strong> on this device.</p>`;


      return;

    }


    const stepIndex =
      STATUS_STEPS.indexOf(
        found.status
      );


    const timelineHtml =
      STATUS_STEPS
        .map(
          (step, i) => {

            let cls = "";

            if (
              i < stepIndex
            ) {
              cls = "is-done";
            } else if (
              i === stepIndex
            ) {
              cls = "is-current";
            }


            return `
              <li class="${cls}">
                ${escapeHtml(step)}
              </li>
            `;

          }
        )
        .join("");


    trackResult.className =
      "track-result";


    trackResult.innerHTML = `
      <div class="track-head">
        <h3>${escapeHtml(found.id)}</h3>

        <span
          class="status-pill"
          data-status="${escapeHtml(found.status)}"
        >
          ${escapeHtml(found.status)}
        </span>
      </div>

      <p>
        <strong>
          ${escapeHtml(found.category)}
        </strong>
        · filed ${formatDate(found.filedAt)}
      </p>

      <p>
        ${escapeHtml(found.description)}
      </p>

      <ol class="timeline">
        ${timelineHtml}
      </ol>
    `;

  }


  if (trackForm) {

    trackForm.addEventListener(
      "submit",
      (e) => {

        e.preventDefault();


        const val =
          document.getElementById(
            "trackInput"
          ).value;


        if (!val.trim()) return;


        renderTrackResult(
          val
        );

      }
    );

  }


  /* ===========================================================
     DASHBOARD
     =========================================================== */

  let activeStatusFilter =
    "all";


  const boardBody =
    document.getElementById(
      "boardBody"
    );

  const boardEmpty =
    document.getElementById(
      "boardEmpty"
    );

  const boardWrap =
    document.querySelector(
      ".board-table-wrap"
    );

  const categoryFilter =
    document.getElementById(
      "categoryFilter"
    );


  function populateCategoryFilter() {

    if (!categoryFilter) return;


    const current =
      categoryFilter.value ||
      "all";


    const categories =
      Array.from(
        new Set(
          loadComplaints()
            .map(
              (c) =>
                c.category
            )
        )
      ).sort();


    categoryFilter.innerHTML =
      '<option value="all">All categories</option>' +

      categories
        .map(
          (c) =>
            `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`
        )
        .join("");


    categoryFilter.value =
      categories.includes(
        current
      )
        ? current
        : "all";

  }


  function nextStatus(status) {

    const idx =
      STATUS_STEPS.indexOf(
        status
      );


    return idx <
      STATUS_STEPS.length - 1
      ? STATUS_STEPS[idx + 1]
      : status;

  }


  function renderBoard() {

    if (!boardBody) return;


    let list =
      loadComplaints();


    if (
      activeStatusFilter !==
      "all"
    ) {

      list =
        list.filter(
          (c) =>
            c.status ===
            activeStatusFilter
        );

    }


    const catVal =
      categoryFilter
        ? categoryFilter.value
        : "all";


    if (
      catVal &&
      catVal !== "all"
    ) {

      list =
        list.filter(
          (c) =>
            c.category ===
            catVal
        );

    }


    if (list.length === 0) {

      boardBody.innerHTML =
        "";


      if (boardEmpty) {

        boardEmpty.classList.add(
          "is-visible"
        );

      }


      if (boardWrap) {

        boardWrap.classList.add(
          "is-empty"
        );

      }


      return;

    }


    if (boardEmpty) {

      boardEmpty.classList.remove(
        "is-visible"
      );

    }


    if (boardWrap) {

      boardWrap.classList.remove(
        "is-empty"
      );

    }


    boardBody.innerHTML =
      list
        .map(
          (c) => `

          <tr class="${
            c.id === lastAddedId
              ? "is-new"
              : ""
          }">

            <td class="mono">
              ${escapeHtml(c.id)}
            </td>

            <td>
              ${escapeHtml(c.category)}
            </td>

            <td>
              ${escapeHtml(
                c.anonymous
                  ? "Anonymous"
                  : c.name
              )}
            </td>

            <td>
              ${escapeHtml(c.priority)}
            </td>

            <td>
              <span
                class="status-pill"
                data-status="${escapeHtml(
                  c.status
                )}"
              >
                ${escapeHtml(
                  c.status
                )}
              </span>
            </td>

            <td>
              ${formatDate(
                c.filedAt
              )}
            </td>

            <td>
              ${
                c.status !==
                "Resolved"
                  ? `
                    <button
                      class="row-link"
                      data-advance="${escapeHtml(
                        c.id
                      )}"
                    >
                      Advance
                    </button>
                  `
                  : ""
              }
            </td>

          </tr>
        `
        )
        .join("");


    lastAddedId =
      null;

  }


  if (boardBody) {

    boardBody.addEventListener(
      "click",
      (e) => {

        const btn =
          e.target.closest(
            "[data-advance]"
          );


        if (!btn) return;


        const id =
          btn.getAttribute(
            "data-advance"
          );


        const list =
          loadComplaints();


        const item =
          list.find(
            (c) =>
              c.id === id
          );


        if (item) {

          item.status =
            nextStatus(
              item.status
            );


          saveComplaints(
            list
          );


          renderBoard();

          renderStats();


          showToast(
            `${id} moved to "${item.status}".`
          );

        }

      }
    );

  }


  document
    .querySelectorAll(
      "[data-filter-status]"
    )
    .forEach(
      (btn) => {

        btn.addEventListener(
          "click",
          () => {

            activeStatusFilter =
              btn.getAttribute(
                "data-filter-status"
              );


            document
              .querySelectorAll(
                "[data-filter-status]"
              )
              .forEach(
                (b) =>
                  b.classList.remove(
                    "is-active"
                  )
              );


            btn.classList.add(
              "is-active"
            );


            renderBoard();

          }
        );

      }
    );


  if (categoryFilter) {

    categoryFilter.addEventListener(
      "change",
      renderBoard
    );

  }


  /* ===========================================================
     STORIES
     =========================================================== */

  const storiesTrack =
    document.getElementById(
      "storiesTrack"
    );

  const storiesDots =
    document.getElementById(
      "storiesDots"
    );


  if (
    storiesTrack &&
    storiesDots
  ) {

    const cards =
      Array.from(
        storiesTrack.children
      );


    storiesDots.innerHTML =
      cards
        .map(
          (_, i) =>
            `<span data-dot="${i}"></span>`
        )
        .join("");


    const dots =
      Array.from(
        storiesDots.children
      );


    if (dots[0]) {

      dots[0].classList.add(
        "is-active"
      );

    }


    dots.forEach(
      (dot, i) => {

        dot.addEventListener(
          "click",
          () => {

            cards[i].scrollIntoView({
              behavior:
                prefersReducedMotion
                  ? "auto"
                  : "smooth",

              inline:
                "start",

              block:
                "nearest"
            });

          }
        );

      }
    );


    let scrollTimer =
      null;


    storiesTrack.addEventListener(
      "scroll",
      () => {

        clearTimeout(
          scrollTimer
        );


        scrollTimer =
          setTimeout(
            () => {

              const scrollLeft =
                storiesTrack.scrollLeft;


              let closest =
                0;


              let closestDist =
                Infinity;


              cards.forEach(
                (card, i) => {

                  const dist =
                    Math.abs(
                      card.offsetLeft -
                      scrollLeft
                    );


                  if (
                    dist <
                    closestDist
                  ) {

                    closestDist =
                      dist;

                    closest =
                      i;

                  }

                }
              );


              dots.forEach(
                (d) =>
                  d.classList.remove(
                    "is-active"
                  )
              );


              if (dots[closest]) {

                dots[
                  closest
                ].classList.add(
                  "is-active"
                );

              }

            },
            100
          );

      },
      {
        passive: true
      }
    );

  }


  /* ===========================================================
     FAQ
     =========================================================== */

  document
    .querySelectorAll(
      ".faq-item"
    )
    .forEach(
      (item) => {

        const btn =
          item.querySelector(
            ".faq-q"
          );


        if (!btn) return;


        btn.addEventListener(
          "click",
          () => {

            const isOpen =
              item.classList.contains(
                "is-open"
              );


            document
              .querySelectorAll(
                ".faq-item"
              )
              .forEach(
                (i) => {

                  i.classList.remove(
                    "is-open"
                  );


                  const question =
                    i.querySelector(
                      ".faq-q"
                    );


                  if (question) {

                    question.setAttribute(
                      "aria-expanded",
                      "false"
                    );

                  }

                }
              );


            if (!isOpen) {

              item.classList.add(
                "is-open"
              );


              btn.setAttribute(
                "aria-expanded",
                "true"
              );

            }

          }
        );

      }
    );


  /* ===========================================================
     UTILITIES
     =========================================================== */

  function escapeHtml(str) {

    return String(str)

      .replace(
        /&/g,
        "&amp;"
      )

      .replace(
        /</g,
        "&lt;"
      )

      .replace(
        />/g,
        "&gt;"
      )

      .replace(
        /"/g,
        "&quot;"
      )

      .replace(
        /'/g,
        "&#39;"
      );

  }


  function formatDate(iso) {

    const d =
      new Date(iso);


    return d.toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric"
      }
    );

  }


  /* ===========================================================
     AUTHENTICATION
     =========================================================== */

  const authBtn =
    document.getElementById(
      "authBtn"
    );
  const adminLoginBtn = document.getElementById("adminLoginBtn");
  let adminLoginMode = false;

  const authModal =
    document.getElementById(
      "authModal"
    );

  const authTabs =
    document.querySelectorAll(
      "[data-auth-tab]"
    );

  const closeAuthButtons =
    document.querySelectorAll(
      "[data-close-auth]"
    );

  const loginForm =
    document.getElementById(
      "loginForm"
    );

  const registerForm =
    document.getElementById(
      "registerForm"
    );

  const forgotPasswordForm = document.getElementById("forgotPasswordForm");
  const resetPasswordForm = document.getElementById("resetPasswordForm");
  const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
  const backToLoginBtn = document.getElementById("backToLoginBtn");
  const resetBackToLoginBtn = document.getElementById("resetBackToLoginBtn");

  const authTitle =
    document.getElementById(
      "authTitle"
    );

  const authSubtitle =
    document.getElementById(
      "authSubtitle"
    );

  const authMessage =
    document.getElementById(
      "authMessage"
    );

  const logoutBtn =
    document.getElementById(
      "logoutBtn"
    );


  /* ===========================================================
     AUTH STORAGE FUNCTIONS
     =========================================================== */

  function getAuthToken() {

    return localStorage.getItem(
      "aimt_auth_token"
    );

  }


  function getAuthUser() {

    try {

      return JSON.parse(
        localStorage.getItem(
          "aimt_auth_user"
        ) || "null"
      );

    } catch (error) {

      return null;

    }

  }


  function saveAuth(
    data
  ) {

    if (
      data &&
      data.token
    ) {

      localStorage.setItem(
        "aimt_auth_token",
        data.token
      );

    }


    if (
      data &&
      data.user
    ) {

      localStorage.setItem(
        "aimt_auth_user",
        JSON.stringify(
          data.user
        )
      );

    }

  }


  function clearAuth() {

    localStorage.removeItem(
      "aimt_auth_token"
    );

    localStorage.removeItem(
      "aimt_auth_user"
    );

  }


  /* ===========================================================
     AUTH UI
     =========================================================== */

  function updateAuthUI() {

    const token =
      getAuthToken();

    const user =
      getAuthUser();


    if (authBtn) {

      if (
        token &&
        user
      ) {

        authBtn.textContent =
          `Hi, ${user.name}`;

      } else {

        authBtn.textContent =
          "Student Login";

      }

    }


    if (logoutBtn) {

      logoutBtn.hidden =
        !(
          token &&
          user
        );

    }

  }


  function showAuthMessage(
    message,
    isError = false
  ) {

    if (!authMessage) {
      return;
    }


    authMessage.textContent =
      message;


    authMessage.style.color =
      isError
        ? "#b01f2e"
        : "";

  }


  /* ===========================================================
     OPEN AUTH
     =========================================================== */

  if (
    authBtn &&
    authModal
  ) {

    authBtn.addEventListener(
      "click",
      () => {

        adminLoginMode = false;

        const loginEmailInput = document.getElementById("loginEmail");
        loginEmailInput.type = "email";
        loginEmailInput.placeholder = "you@example.com";
        forgotPasswordBtn.hidden = false;

        const tabs = document.querySelector(".auth-tabs");
        if (tabs) tabs.hidden = false;

        authModal.hidden =
          false;

        showAuthMessage(
          ""
        );

      }
    );

  }

  if (adminLoginBtn && authModal) {
    adminLoginBtn.addEventListener("click", () => {
      adminLoginMode = true;
      authModal.hidden = false;
      loginForm.hidden = false;
      registerForm.hidden = true;
      forgotPasswordForm.hidden = true;
      resetPasswordForm.hidden = true;
      forgotPasswordBtn.hidden = true;
      const loginEmailInput = document.getElementById("loginEmail");
      loginEmailInput.type = "text";
      loginEmailInput.placeholder = "Admin email or ID";
      const tabs = document.querySelector(".auth-tabs");
      if (tabs) tabs.hidden = true;
      authTitle.textContent = "Administrator Login";
      authSubtitle.textContent = "Sign in with your authorized AIMT administrator account.";
      showAuthMessage("");
    });
  }


  /* ===========================================================
     CLOSE AUTH
     =========================================================== */

  closeAuthButtons.forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          if (authModal) {

            authModal.hidden =
              true;

          }

        }
      );

    }
  );


  /* ===========================================================
     AUTH TABS
     =========================================================== */

  authTabs.forEach(
    (tab) => {

      tab.addEventListener(
        "click",
        () => {

          const selectedTab =
            tab.getAttribute(
              "data-auth-tab"
            );


          authTabs.forEach(
            (t) =>
              t.classList.remove(
                "is-active"
              )
          );


          tab.classList.add(
            "is-active"
          );


          showAuthMessage(
            ""
          );


          if (
            selectedTab ===
            "login"
          ) {

            loginForm.hidden =
              false;

            registerForm.hidden =
              true;
            forgotPasswordForm.hidden = true;
            resetPasswordForm.hidden = true;
            forgotPasswordBtn.hidden = false;


            authTitle.textContent =
              "Student Login";

            const loginEmailInput = document.getElementById("loginEmail");
            loginEmailInput.type = "email";
            loginEmailInput.placeholder = "you@example.com";


            authSubtitle.textContent =
              "Sign in to submit and track complaints.";


            loginForm.classList.remove(
              "auth-form"
            );


            void loginForm.offsetWidth;


            loginForm.classList.add(
              "auth-form"
            );

          }


          if (
            selectedTab ===
            "register"
          ) {

            loginForm.hidden =
              true;

            registerForm.hidden =
              false;


            authTitle.textContent =
              "Create Student Account";


            authSubtitle.textContent =
              "Create your AIMT student grievance account.";


            registerForm.classList.remove(
              "auth-form"
            );


            void registerForm.offsetWidth;


            registerForm.classList.add(
              "auth-form"
            );

          }

        }
      );

    }
  );


  /* ===========================================================
     REGISTER FUNCTION
     =========================================================== */

  async function registerUser() {

    const name =
      document
        .getElementById(
          "registerName"
        )
        .value
        .trim();


    const email =
      document
        .getElementById(
          "registerEmail"
        )
        .value
        .trim();


    const password =
      document
        .getElementById(
          "registerPassword"
        )
        .value;


    const studentId =
      document
        .getElementById(
          "registerStudentId"
        )
        .value
        .trim();


    const department =
      document
        .getElementById(
          "registerDepartment"
        )
        .value
        .trim();


    const year =
      document
        .getElementById(
          "registerYear"
        )
        .value;


    if (
      !name ||
      !email ||
      !password ||
      !studentId ||
      !department ||
      !year
    ) {

      showAuthMessage(
        "Please fill all fields.",
        true
      );

      return;

    }


    if (
      password.length < 6
    ) {

      showAuthMessage(
        "Password must be at least 6 characters.",
        true
      );

      return;

    }


    const button =
      registerForm.querySelector(
        "button[type='submit']"
      );


    const oldText =
      button.innerText;


    try {

      button.disabled =
        true;


      button.innerText =
        "Creating account...";


      showAuthMessage(
        "Creating your account..."
      );

      console.log("🚀 REGISTER FUNCTION CALLED");
      console.log("🌐 API URL:", `${API_BASE}/auth/register`);
      const response =
        await fetch(
          `${API_BASE}/auth/register`,
          {

            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify({
                name,
                email,
                password,
                studentId,
                department,
                year
              })

          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.message ||
          "Registration failed."
        );

      }

      /* SAVE JWT + USER */

      saveAuth(
        data
      );

      // The authenticated portal enforces role-specific experiences.
      setTimeout(() => { window.location.href = "portal.html"; }, 300);


      /* UPDATE HEADER */

      updateAuthUI();


      showAuthMessage(
        "Account created successfully!"
      );


      showToast(
        "Account created successfully!"
      );


      registerForm.reset();


      setTimeout(
        () => {

          authModal.hidden =
            true;

        },
        1000
      );


    } catch (error) {

      console.error(
        "Register Error:",
        error
      );


      showAuthMessage(
        error.message,
        true
      );


      showToast(
        error.message
      );


    } finally {

      button.disabled =
        false;


      button.innerText =
        oldText;

    }

  }


  /* ===========================================================
     REGISTER SUBMIT
     =========================================================== */

  if (registerForm) {

    registerForm.addEventListener(
      "submit",
      async (e) => {

        e.preventDefault();

        await registerUser();

      }
    );

  }


  /* ===========================================================
     LOGIN FUNCTION
     =========================================================== */

  async function loginUser() {

    const email =
      document
        .getElementById(
          "loginEmail"
        )
        .value
        .trim();


    const password =
      document
        .getElementById(
          "loginPassword"
        )
        .value;


    if (
      !email ||
      !password
    ) {

      showAuthMessage(
        "Please enter email and password.",
        true
      );

      return;

    }


    const button =
      loginForm.querySelector(
        "button[type='submit']"
      );


    const oldText =
      button.innerText;


    try {

      button.disabled =
        true;


      button.innerText =
        "Logging in...";


      showAuthMessage(
        "Signing you in..."
      );


      const response =
        await fetch(
          `${API_BASE}/auth/login`,
          {

            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify({
                [adminLoginMode ? "studentId" : "email"]: email,
                password
              })

          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.message ||
          "Login failed."
        );

      }

      if (adminLoginMode && data.user.role !== "admin") {
        throw new Error("This account is not authorized for the administrator panel.");
      }


      /* SAVE JWT + USER */

      saveAuth(
        data
      );


      /* UPDATE UI */

      // Login responses include the role; portal.html selects the correct
      // student or administrator experience after this authenticated redirect.
      setTimeout(() => { window.location.href = "portal.html"; }, 300);

      updateAuthUI();


      showAuthMessage(
        `Welcome back, ${data.user.name}!`
      );


      showToast(
        `Welcome back, ${data.user.name}!`
      );


      loginForm.reset();


      setTimeout(
        () => {

          authModal.hidden =
            true;

        },
        1000
      );


    } catch (error) {

      console.error(
        "Login Error:",
        error
      );


      showAuthMessage(
        error.message,
        true
      );


      showToast(
        error.message
      );


    } finally {

      button.disabled =
        false;


      button.innerText =
        oldText;

    }

  }


  /* ===========================================================
     LOGIN SUBMIT
     =========================================================== */

  if (loginForm) {

    loginForm.addEventListener(
      "submit",
      async (e) => {

        e.preventDefault();

        await loginUser();

      }
    );

  }

  const showLoginForm = () => {
    loginForm.hidden = false;
    registerForm.hidden = true;
    forgotPasswordForm.hidden = true;
    resetPasswordForm.hidden = true;
    forgotPasswordBtn.hidden = adminLoginMode;
    authTitle.textContent = adminLoginMode ? "Administrator Login" : "Student Login";
    authSubtitle.textContent = adminLoginMode
      ? "Sign in with your authorized AIMT administrator account."
      : "Sign in to submit and track complaints.";
  };

  if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener("click", () => {
      if (adminLoginMode) return;
      loginForm.hidden = true;
      forgotPasswordForm.hidden = false;
      resetPasswordForm.hidden = true;
      authTitle.textContent = "Reset student password";
      authSubtitle.textContent = "We will send a six-digit OTP to your registered email.";
      showAuthMessage("");
    });
  }

  if (backToLoginBtn) backToLoginBtn.addEventListener("click", showLoginForm);
  if (resetBackToLoginBtn) resetBackToLoginBtn.addEventListener("click", showLoginForm);

  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener("submit", async event => {
      event.preventDefault();
      const email = document.getElementById("forgotEmail").value.trim();
      try {
        const response = await fetch(`${API_BASE}/auth/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Could not send reset OTP");
        document.getElementById("resetEmail").value = email;
        forgotPasswordForm.hidden = true;
        resetPasswordForm.hidden = false;
        showAuthMessage(data.message);
      } catch (error) {
        showAuthMessage(error.message, true);
      }
    });
  }

  if (resetPasswordForm) {
    resetPasswordForm.addEventListener("submit", async event => {
      event.preventDefault();
      const email = document.getElementById("resetEmail").value.trim();
      const token = document.getElementById("resetOtp").value.trim();
      const password = document.getElementById("resetPassword").value;
      const confirmPassword = document.getElementById("resetConfirmPassword").value;
      try {
        const response = await fetch(`${API_BASE}/auth/reset-password/${encodeURIComponent(token)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, confirmPassword })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Could not reset password");
        showLoginForm();
        loginForm.reset();
        showAuthMessage("Password reset successful. You can now log in.");
      } catch (error) {
        showAuthMessage(error.message, true);
      }
    });
  }


  /* ===========================================================
     LOGOUT
     =========================================================== */

  if (logoutBtn) {

    logoutBtn.addEventListener(
      "click",
      () => {

        clearAuth();

        updateAuthUI();


        if (loginForm) {
          loginForm.reset();
        }


        if (registerForm) {
          registerForm.reset();
        }


        showAuthMessage(
          "Logged out successfully."
        );


        showToast(
          "Logged out successfully."
        );


        setTimeout(
          () => {

            if (authModal) {

              authModal.hidden =
                true;

            }

          },
          500
        );

      }
    );

  }


  /* ===========================================================
     INIT
     =========================================================== */

  const yearEl =
    document.getElementById(
      "year"
    );


  if (yearEl) {

    yearEl.textContent =
      String(
        new Date().getFullYear()
      );

  }


  populateCategoryFilter();

  renderStats();

  renderBoard();

  updateAuthUI();

})();


// ========================================
// BACKEND CONNECTION TEST
// ========================================

async function testBackendConnection() {
    try {
        const response = await fetch(`${window.AIMT_API_BASE || "/api"}/health`);

        const data = await response.json();

        console.log("✅ Backend Response:", data);

    } catch (error) {
        console.error("❌ Backend Connection Failed:", error);
    }
}

testBackendConnection();
