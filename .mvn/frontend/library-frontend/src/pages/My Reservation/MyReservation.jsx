import React from "react";
import { AccessAlarm, Book, CalendarToday } from "@mui/icons-material";
import { tabs } from "./tabs";
import MyReservationCard from "./MyReservationCard";

const MyReservation = () => {
  const state = { total: 6, active: 2, available: 1 };
  const [activeTab, setActiveTab] = React.useState(0);

  return (
    <div className="min-h-screen py-8">
      <div className="px-4 sm:px-6 lg:px-8">
        {/* header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center space-x-3">
            <span className="text-5xl">📚</span>

            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              My Reservation
            </span>
          </h1>

          <p className="text-lg text-gray-600">
            Manage and track your book reservations
          </p>
        </div>

        {/* state */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* 1. Reservation */}
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Total Reservation
                </p>

                <p className="text-4xl font-extrabold text-gray-900 mt-1">
                  {state.total}
                </p>
              </div>

              <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                <Book className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          {/* 2. Active */}
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Active Reservation
                </p>

                <p className="text-4xl font-extrabold text-gray-900 mt-1">
                  {state.active}
                </p>
              </div>

              <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                <AccessAlarm className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          {/* 3. Ready To Pickup */}
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Ready To Pickup
                </p>

                <p className="text-4xl font-extrabold text-gray-900 mt-1">
                  {state.available}
                </p>
              </div>

              <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                <CalendarToday className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6 overflow-hidden">
          <div className="flex border-b border-gray-200">
            {tabs.map((tab, index) => (
              <button
                onClick={() => setActiveTab(index)}
                key={index}
                className={`flex-1 px-6 py-4 font-semibold text-base flex items-center ${
                  index === 0
                    ? "text-indigo-600 border-b-4 border-indigo-600 bg-indigo-50"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        {/* Content - Reservation List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myReservation.map((reservation) => (
            <MyReservationCard key={reservation.id} reservation={reservation} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MyReservation;
