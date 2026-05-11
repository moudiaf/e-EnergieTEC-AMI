import React from 'react';
import { TicketsSection } from './TicketsSection';
import { TechnicianSection } from './TechnicianSection';
import { Ticket, User } from '../types';

interface TicketsWrapperProps {
    tickets: Ticket[];
    notifications: any[];
    currentUser: User | null;
    setEditingTicket: (ticket: Ticket | null) => void;
    setIsTicketModalOpen: (open: boolean) => void;
    updateTicketStatus: (id: string, status: string) => void;
    ticketSearch: string;
    setTicketSearch: (query: string) => void;
}

export const TicketsWrapper = ({
    tickets,
    notifications,
    currentUser,
    setEditingTicket,
    setIsTicketModalOpen,
    updateTicketStatus,
    ticketSearch,
    setTicketSearch
}: TicketsWrapperProps) => {
    if (currentUser?.role === 'tech') {
        return (
            <TechnicianSection
                tickets={tickets}
                notifications={notifications}
                currentUser={currentUser}
                updateTicketStatus={updateTicketStatus}
            />
        );
    }

    return (
        <TicketsSection
            tickets={tickets}
            currentUser={currentUser}
            setEditingTicket={setEditingTicket}
            setIsTicketModalOpen={setIsTicketModalOpen}
            ticketSearch={ticketSearch}
            setTicketSearch={setTicketSearch}
        />
    );
};
