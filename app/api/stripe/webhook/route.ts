import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStudentByClerkId } from "@/sanity/lib/student/getStudentByClerkId";
import { createEnrollment } from "@/sanity/lib/courses/createEnrollment";
import stripe from "@/lib/stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
	try {
		
	const body = await req.text();
	const headersList = await headers();
	const signature = headersList.get("stripe-signature");

	if (!signature) {
		return new NextResponse("No signature found", { status: 400 });
	}

	let event: Stripe.Event;

	try {
		event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
	} catch (error: unknown) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		console.error(`Webhook signature verification failed: ${errorMessage}`);

		return new NextResponse(`Webhook Error: ${errorMessage}`, {
			status: 400,
		});
	}

	  // Handle the checkout.session.completed event

		switch (event.type) {
			case "checkout.session.completed": 
				const session = event.data.object as Stripe.Checkout.Session;

				//Get the courseId from the metadata
				const courseId = session.metadata?.courseId;
				const userId = session.metadata?.userId;

				if (!courseId || !userId) {
					return new NextResponse("Missing metadata", { status: 400 });
				}

				const student = await getStudentByClerkId(userId);

				if (!student) {
					return new NextResponse("Student not found", { status: 404 });
				}

				   // Create an enrollment record in Sanity

					 await createEnrollment({
						studentId: student._id,
						courseId,
						paymentId: session.id,
						amount: session.amount_total! / 100, // Convert from cents to dollars
					});

					return new NextResponse(null, { status: 200 }); //OK

		}
		return new NextResponse(null, { status: 400 }); // BAD REQUEST

	} catch (error) {
		console.error("Error in webhook handler:", error);
		return new NextResponse("Webhook handler failed", { status: 500 }); //INTERNAL SERVER ERROR
	}

}
