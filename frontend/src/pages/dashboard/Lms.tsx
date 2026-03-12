import { useState, useEffect } from "react";
import { authService } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import QuickAccess from "../../components/Dashboard/LMS/QuickAccess";
import Announcements from "../../components/Dashboard/LMS/Announcements";
import StatsCard from "../../components/Dashboard/LMS/StatsCard";
import Welcome from "../../components/Dashboard/LMS/Welcome";
import Courses, { type Course } from "../../components/Dashboard/LMS/Courses";

// ─── Static data kept for the "Explore Courses" section only ────────────────
const coursesData: Course[] = [
  // ========== VIDEO COURSES (3) ==========
  {
    id: 1,
    title: "Foundation Program for Competitive Exams (Comprehensive Preparation Course)",
    subtitle: "Complete Video Course 2025",
    shortDescription: "Comprehensive video lectures covering all fundamental concepts for competitive exam preparation.",
    image: "/images/courses/neev-course.png",
    courseType: "video",

    // 🔑 ONLY REQUIRED DATA FOR CARD
    totalVideos: 150,
    completedTests: 0,
    totalTests: 15,
    expiryDate: "Dec 31, 2025",

    progress: 10,
    viewLink: "/lms/video-course-player",

    price: "FREE",
    originalPrice: "₹2,999",
    discount: "Discount of 100% applied",

    features: [],
  },
  {
    id: 2,
    title: "Quantitative Aptitude – Advanced Mastery Program",
    subtitle: "Complete Video Course 2025",
    shortDescription: "Master advanced quantitative aptitude with comprehensive video lessons and practice problems.",
    image: "/images/courses/neev-course.png",
    courseType: "video",
    totalVideos: 100,
    completedTests: 0,
    totalTests: 10,
    expiryDate: "Dec 31, 2025",
    progress: 0,
    viewLink: "/lms/video-course-player",
    price: "FREE",
    originalPrice: "₹2,499",
    discount: "Discount of 100% applied",
    features: [],
  },
  {
    id: 3,
    title: "Reasoning & General Intelligence – Complete Course",
    subtitle: "Complete Video Course 2025",
    shortDescription: "Boost your reasoning skills with comprehensive video lectures covering all major topics.",
    image: "/images/courses/neev-course.png",
    courseType: "video",
    totalVideos: 80,
    completedTests: 0,
    totalTests: 8,
    expiryDate: "Dec 31, 2025",
    progress: 0,
    viewLink: "/lms/video-course-player",
    price: "FREE",
    originalPrice: "₹1,999",
    discount: "Discount of 100% applied",
    features: [],
  },

  // ========== TEST COURSES (3) ==========
  {
    id: 4,
    title: "English Language - Professional Skills Program",
    subtitle: "Complete Test Series 2025",
    shortDescription: "Comprehensive test series for English language proficiency and professional communication.",
    image: "/images/courses/neev-course.png",
    courseType: "test",
    totalVideos: 0,
    completedTests: 13,
    totalTests: 20,
    expiryDate: "Dec 31, 2025",
    progress: 65,
    viewLink: "/lms/test-course-details",
    price: "FREE",
    originalPrice: "₹599",
    discount: "Discount of 100% applied",
    features: [],
  },
  {
    id: 5,
    title: "General Awareness (GA) – Complete Coverage Course",
    subtitle: "Complete Test Series 2025",
    shortDescription: "Master current affairs and general knowledge with our comprehensive test series.",
    image: "/images/courses/neev-course.png",
    courseType: "test",
    totalVideos: 0,
    completedTests: 9,
    totalTests: 20,
    expiryDate: "Dec 31, 2025",
    progress: 45,
    viewLink: "/lms/test-course-details",
    price: "FREE",
    originalPrice: "₹599",
    discount: "Discount of 100% applied",
    features: [],
  },
  {
    id: 6,
    title: "Mathematics – Booster & Speed Enhancement Course",
    subtitle: "Complete Test Series 2025",
    shortDescription: "Boost your problem-solving speed with high-level mathematics questions and solutions.",
    image: "/images/courses/neev-course.png",
    courseType: "test",
    totalVideos: 0,
    completedTests: 6,
    totalTests: 20,
    expiryDate: "Dec 31, 2025",
    progress: 30,
    viewLink: "/lms/test-course-details",
    price: "FREE",
    originalPrice: "₹599",
    discount: "Discount of 100% applied",
    features: [],
  },
];

// ─── Enrolled Courses API integration ───────────────────────────────────────

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const formatExpiry = (ts: number): string => {
  const d = new Date(ts * 1000);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

interface LibraryItem {
  _id: { $oid: string } | string;
  name: string;
  price: number;
  actual_price: number;
  package_type: string;
  expiry_date: number;
  package_image: string;
  purchased: boolean;
  courses: Array<{ _id: { $oid: string } | string; title: string }>;
  live_status: boolean;
}

const mapToCourse = (item: LibraryItem, index: number): Course => ({
  id: index + 1,
  title: item.name || item.courses[0]?.title || "",
  subtitle:
    item.package_type === "video"
      ? "Complete Video Course 2025"
      : "Complete Test Series 2025",
  image: item.package_image,
  courseType: item.package_type === "video" ? "video" : "test",
  totalVideos: 0,
  totalTests: 0,
  completedTests: 0,
  expiryDate: item.expiry_date ? formatExpiry(item.expiry_date) : "",
  progress: 0,
  viewLink:
    item.package_type === "video"
      ? "/lms/video-course-player"
      : "/lms/test-course-details",
  price: item.price === 0 ? "FREE" : `₹${item.price}`,
  originalPrice: `₹${item.actual_price}`,
  features: [],
});

// ─── Component ───────────────────────────────────────────────────────────────

const Lms = () => {
  const { sessionDegraded } = useAuth();
  // Enrolled Courses state — populated from API on mount
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);

  useEffect(() => {
    if (!authService.isAuthenticated()) return; // Not logged in — skip the call

    authService
      .getApiClient()
      .get<{ success: boolean; data: LibraryItem[] }>("/api/auth/my-library")
      .then((res) => {
        if (res.data.success && Array.isArray(res.data.data)) {
          setEnrolledCourses(res.data.data.map(mapToCourse));
        }
      })
      .catch(() => {
        // Fail silently — section stays empty, no UI change
      });
  }, []);

  return (
    <>
      {/* Degraded session banner — shown when RUPPI token is stale */}
      {sessionDegraded && (
        <div className="mb-[25px] flex items-start gap-3 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
          <span className="material-symbols-outlined text-yellow-500 text-[20px] mt-0.5 shrink-0">warning</span>
          <div>
            <p className="font-semibold">Session needs refresh</p>
            <p className="text-yellow-700 mt-0.5">
              Your enrolled courses couldn't be loaded. Your external session has expired.{" "}
              <a href="/authentication/forgot-password" className="underline font-medium">
                Reset your password
              </a>{" "}
              to restore full access.
            </p>
          </div>
        </div>
      )}

      {/* Welcome Section */}
      <div className="mb-[25px]">
        <Welcome />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-[25px] mb-[25px]">
        <StatsCard
          title="TOTAL TESTS ATTEMPTED"
          value="24"
          icon="track_changes"
          iconClassName="bg-red-50 text-red-500"
          badge={
            <span className="inline-block bg-success-50 text-success-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-1 w-fit">
              +4 this week
            </span>
          }
        />

        <StatsCard
          title="ENROLLED COURSES"
          value="6"
          icon="library_books"
          iconClassName="bg-purple-50 text-purple-600"
          badge={
            <div className="flex items-center gap-1 bg-success-50 text-success-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-1 w-fit">
              <i className="material-symbols-outlined text-[12px]">
                trending_up
              </i>
              <span>+2 new</span>
            </div>
          }
        />

        <StatsCard
          title="TOTAL DOCUMENTS"
          value="350"
          icon="description"
          iconClassName="bg-blue-50 text-blue-500"
          badge={
            <span className="inline-block bg-success-50 text-success-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-1 w-fit">
              +5 new
            </span>
          }
        />
      </div>

      {/* Courses + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[25px] mb-[25px]">
        <div className="lg:col-span-2">
          {/* ← enrolledCourses replaces static coursesData here */}
          <Courses
            title="Enrolled Courses"
            courses={enrolledCourses}
            variant="horizontal"
          />
        </div>

        <div className="flex flex-col gap-[25px]">
          <QuickAccess />
          <Announcements />
        </div>
      </div>

      {/* Explore Courses — static data unchanged */}
      <div className="grid grid-cols-1 gap-[15px] mb-[25px]">
        <Courses title="Explore Courses" courses={coursesData} />
      </div>
    </>
  );
};

export default Lms;
