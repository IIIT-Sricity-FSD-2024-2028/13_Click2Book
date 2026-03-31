Summary of the Interaction

Domain: Online Bus/Train Ticket Booking System

Problem Statement:
Designing and understanding an online ticket booking system that supports real-time seat availability, secure payments, ticket generation, cancellations, refunds, and role-based access for different stakeholders.

Date of Interaction: 01-02-2026


Mode of Interaction: Video Call


Duration: 45–50 minutes


Publicly Accessible Video Link:
https://drive.google.com/file/d/1W2GIbBrOfUv6bexIQNQBSiYjTCe7WVkj/view?usp=sharing

Domain Expert Details

Role / Designation:
System Engineer | IT-OT Technical Architect | Cybersecurity & Digital Transformation Specialist

Nature of Work:
System Engineer & Web Developer (Frontend & Backend) specializing in Real-Time Web Applications and Secure Systems

Experience in the Domain:
The domain expert has relevant experience in the online ticket booking domain through an academic internship at RedBus, where he gained hands-on exposure to online bus ticket booking workflows, real-time seat availability handling, and web-based booking features.

Additionally, he has professional experience as a System Engineer working on IT-OT integration, real-time systems, and digital transformation initiatives. His expertise includes frontend and backend development, system architecture design, and cybersecurity governance.

This expertise enables travelers to book bus or train tickets online, check seat availability in real time, complete secure payments, and manage cancellations or refunds efficiently.

Primary Goals of the Problem Statement

• Provide real-time ticket booking for bus and train services

• Ensure secure payment and refund processing

• Maintain accurate seat availability

• Support system scalability and reliability


• Improve user experience and operational efficiency

Key Terms and Their Meanings

Seat Availability – Real-time information about available seats for a selected journey

Booking ID – A unique identifier generated for each ticket booking

Payment Gateway – An external service that securely processes payments

Cancellation Policy – Rules that define refund eligibility and applicable charges

Refund Processing – The procedure of returning money after ticket cancellation

Actors and Responsibilities
Passenger

Search routes

Book tickets

Make payments

Cancel bookings

Request refunds

Admin

Manage users

Manage routes and schedules

Configure system settings

Bus/Train Operator

Update schedules

Manage seat availability

Set pricing

Payment Gateway

Handle payment transactions

Process refunds

System

Validate bookings

Allocate seats

Generate tickets

Update booking status

Core Workflows
Workflow 1: Ticket Booking

Trigger Condition:
User selects source, destination, and travel date

Steps:

User searches for available buses/trains

System displays real-time seat availability

User selects seats and enters passenger details

Payment is processed through the payment gateway

System confirms booking and generates ticket

Outcome:
Ticket is successfully booked and confirmed

Workflow 2: Ticket Cancellation and Refund

Trigger Condition:
User requests cancellation of a booked ticket

Steps:

User selects the ticket to cancel

System checks cancellation policy

Refund amount is calculated

Ticket status is updated to cancelled

Refund is initiated

Outcome:
Ticket is cancelled and refund process is started

Workflow 3: Admin Schedule Management

Trigger Condition:
Admin logs into the system

Steps:

Admin adds or updates routes and schedules

Admin configures seat layout and fares

System validates and saves changes

Outcome:
Updated schedules are available for booking

Rules, Constraints, and Exceptions
Mandatory Rules

• Payment must be completed before booking confirmation

• Cancellation must follow defined refund policies

Constraints

• Limited seats per bus/train

• Refund processing time depends on the payment gateway

Common Exceptions

• Payment success but ticket not generated

• Seat conflict due to simultaneous bookings

Situations Where Issues Occur

• Network issues during payment

• Delay in refund processing

Current Challenges

• Real-time synchronization of seat availability

• Handling high traffic during peak seasons

• Payment failures and transaction delays

• Managing refunds and complaints

Assumptions & Clarifications
Confirmed Assumptions

• Users prefer online ticket booking

• Real-time updates are critical for trust

Corrected Assumptions

• Refunds are not always instant

• Seat availability can change rapidly

Open Questions

• Handling partial refunds for multi-leg journeys

• Improving system performance during peak hours
