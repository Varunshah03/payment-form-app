import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Add this import
import bgImage from "../assets/360_F_652225930_sbWHvu8GlyCrcGwTweBdEAlf8xor5VXL.jpg"; // Verify path

function ContributeForm() {
  const [amount, setAmount] = useState(1000);
  const [customAmount, setCustomAmount] = useState("");
  const [tip, setTip] = useState(0);
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    address: "",
    anonymous: false,
  });
  const [errors, setErrors] = useState({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [paymentId, setPaymentId] = useState("");
  const [fact, setFact] = useState("");
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const navigate = useNavigate(); // Add navigate hook

  const contributionOptions = [1000, 2500, 4000];
  const tipOptions = [0, 5, 10, 18];

  useEffect(() => {
    if (window.Razorpay) return;

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => console.log("Razorpay script loaded");
    script.onerror = () => console.error("Failed to load Razorpay script");
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!form.name) newErrors.name = "Field Required";
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email))
      newErrors.email = "Field Required";
    if (!form.mobile || !/^\d{10}$/.test(form.mobile))
      newErrors.mobile = "Please enter a valid number";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotal = () => {
    const baseAmount = customAmount ? parseFloat(customAmount) : amount;
    const tipAmount = baseAmount * (tip / 100);
    return (baseAmount + tipAmount).toFixed(2);
  };

  // Add a list of fallback facts
  const fallbackFacts = [
    "Over 150M children globally work in child labor, missing education.",
    "59M children lack access to primary education, mostly in low-income areas.",
    "1 in 4 underprivileged children faces malnutrition, stunting growth.",
    "152M children live in extreme poverty, surviving on less than $1.90/day.",
    "Many underprivileged children lack clean water, risking health daily.",
  ];

  // Modify the fetchFact function
  const fetchFact = async () => {
    setFact(""); // Clear previous fact
    try {
      const timestamp = Date.now(); // Add unique parameter for randomization
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${
          import.meta.env.VITE_GEMINI_API_KEY
        }`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Provide a unique, concise fact (max 100 characters) about underprivileged children, different from previous responses. Timestamp: ${timestamp}`,
                  },
                ],
              },
            ],
          }),
        }
      );
      const data = await response.json();
      if (data.candidates && data.candidates[0]?.content.parts[0].text) {
        setFact(data.candidates[0].content.parts[0].text);
      } else {
        // Cycle through fallback facts using a random index
        const randomIndex = Math.floor(Math.random() * fallbackFacts.length);
        setFact(fallbackFacts[randomIndex]);
      }
    } catch (error) {
      console.error("Error fetching fact:", error);
      // Cycle through fallback facts using a random index
      const randomIndex = Math.floor(Math.random() * fallbackFacts.length);
      setFact(fallbackFacts[randomIndex]);
    }
  };

  const waitForRazorpay = () => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        if (window.Razorpay) {
          clearInterval(checkInterval);
          resolve();
        } else if (Date.now() - startTime > 1000) {
          clearInterval(checkInterval);
          reject(new Error("Razorpay script failed to load within 1 second"));
        }
      }, 50);
    });
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoadingPayment(true);
    try {
      await waitForRazorpay();

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/create-order`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: Math.round(calculateTotal()), // Razorpay expects amount in paise
            currency: "INR",
          }),
        }
      );
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: data.name || "Fundraiser Contribution",
        order_id: data.orderId,
        handler: async function (response) {
          setPaymentId(response.razorpay_payment_id);
          await fetchFact();
          setShowConfirmation(true);
          setIsLoadingPayment(false);
        },
        modal: {
          ondismiss: () => {
            setIsLoadingPayment(false);
            console.log("Razorpay modal closed");
          },
        },
        prefill: {
          name: form.anonymous ? "" : form.name,
          email: form.anonymous ? "" : form.email,
          contact: form.anonymous ? "" : form.mobile,
        },
        theme: { color: "#3399cc" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      setIsLoadingPayment(false);
      console.error("Error:", error);
      alert("Failed to initiate payment. Please try again.");
    }
  };

  const handleClose = () => {
    setShowConfirmation(false);
    // Reset form state
    setAmount(1000);
    setCustomAmount("");
    setTip(0);
    setForm({
      name: "",
      email: "",
      mobile: "",
      address: "",
      anonymous: false,
    });
    setErrors({});
    setPaymentId("");
    setFact("");
    // Navigate to reset component
    navigate("/contribute", { replace: true });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        willChange: "transform",
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
      }}
    >
      <div
        className="max-w-md w-full sm:w-11/12 xs:w-11/12 p-6 bg-white bg-opacity-90 shadow-md rounded-lg mx-4"
        style={{
          maxHeight: "90vh",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          backgroundClip: "padding-box",
        }}
      >
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Choose a contribution amount
        </h1>
        <p className="text-sm text-gray-600 text-center mb-4">
          Most Contributors contribute approx ₹2500 to this Fundraiser
        </p>
        <div className="flex gap-2 mb-4 justify-center flex-wrap">
          {contributionOptions.map((opt) => (
            <button
              key={opt}
              className={`p-2 border rounded ${
                amount === opt && !customAmount
                  ? "bg-teal-500 text-white"
                  : "bg-gray-100 text-gray-700"
              } hover:bg-teal-600 hover:text-white transition duration-200 min-w-[80px] text-center`}
              onClick={() => {
                setAmount(opt);
                setCustomAmount("");
              }}
            >
              ₹{opt}
            </button>
          ))}
          <button
            className={`p-2 border rounded ${
              customAmount
                ? "bg-teal-500 text-white"
                : "bg-gray-100 text-gray-700"
            } hover:bg-teal-600 hover:text-white transition duration-200 min-w-[80px] text-center`}
            onClick={() => setCustomAmount("")}
          >
            Other Amount
          </button>
        </div>
        <input
          type="number"
          placeholder="Enter other amount"
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="mb-6 mt-4 p-3 bg-green-50 rounded-lg text-sm text-gray-700">
          Ketto is charging 0% platform fee* for this fundraiser, relying solely
          on the generosity of contributors like you.{" "}
          <span className="text-blue-600 cursor-pointer">ℹ️</span>
          <div className="mt-2">
            Support us by adding a tip of:{" "}
            <select
              value={tip}
              onChange={(e) => setTip(parseInt(e.target.value))}
              className="custom-select p-2 border border-teal-400 rounded-lg bg-white bg-opacity-80 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400 transition duration-200 shadow-sm"
              style={{
                minWidth: "90px",
                marginLeft: "0.5rem",
                marginRight: "0.5rem",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              {tipOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}% (₹
                  {(customAmount ? parseFloat(customAmount) : amount) *
                    (opt / 100)}
                  )
                </option>
              ))}
            </select>
          </div>
          <p className="mt-1 font-semibold">
            Total Amount: INR {calculateTotal()}
          </p>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`w-full p-2 border ${
                errors.name ? "border-red-500" : "border-gray-300"
              } rounded-lg focus:outline-none focus:ring-2 ${
                errors.name ? "focus:ring-red-500" : "focus:ring-blue-500"
              }`}
            />
            <span className="absolute right-3 top-2 text-gray-400">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10 10a4 4 0 100-8 4 4 0 000 8zm0 2c-4 0-7 2-7 4v2h14v-2c0-2-3-4-7-4z" />
              </svg>
            </span>
          </div>
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
          )}
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email ID <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={`w-full p-2 border ${
                errors.email ? "border-red-500" : "border-gray-300"
              } rounded-lg focus:outline-none focus:ring-2 ${
                errors.email ? "focus:ring-red-500" : "focus:ring-blue-500"
              }`}
            />
            <span className="absolute right-3 top-2 text-gray-400">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </span>
          </div>
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="text-green-600">🇮🇳</span> Your Mobile Number{" "}
            <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              className={`w-full p-2 border ${
                errors.mobile ? "border-red-500" : "border-gray-300"
              } rounded-lg focus:outline-none focus:ring-2 ${
                errors.mobile ? "focus:ring-red-500" : "focus:ring-blue-500"
              }`}
            />
            <span className="absolute right-3 top-2 text-gray-400">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.773-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
            </span>
          </div>
          {errors.mobile && (
            <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>
          )}
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address
          </label>
          <div className="relative">
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute right-3 top-2 text-gray-400">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10 2C6.13 2 3 5.13 3 9c0 5.25 7 9 7 9s7-3.75 7-9c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 10 6a2.5 2.5 0 0 1 0 5.5z" />
              </svg>
            </span>
          </div>
        </div>
        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={form.anonymous}
              onChange={(e) =>
                setForm({ ...form, anonymous: e.target.checked })
              }
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">
              Make my contribution anonymous
            </span>
          </label>
        </div>
        <button
          onClick={handleSubmit}
          className="w-full p-3 bg-teal-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 flex items-center justify-center"
          disabled={isLoadingPayment}
        >
          {isLoadingPayment ? (
            <svg
              className="animate-spin h-5 w-5 mr-2 text-white"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <text x="0" y="15" fontSize="15"></text>
            </svg>
          )}
          {isLoadingPayment
            ? "Loading..."
            : `Proceed To Contribute ₹${calculateTotal()}`}
        </button>
        <p className="text-xs text-gray-500 text-center mt-2">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold text-green-600 mb-4">
              Payment Successful!
            </h2>
            <p className="text-gray-700 mb-4">
              Thank you for your contribution. Payment ID: {paymentId}
            </p>
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h3 className="text-sm font-semibold text-blue-600 mb-2">
                Did You Know?
              </h3>
              <p className="text-sm text-gray-700">{fact}</p>
            </div>
            <button
              onClick={handleClose}
              className="w-full p-2 bg-teal-500 text-white rounded-lg hover:bg-blue-600 transition duration-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ContributeForm;
