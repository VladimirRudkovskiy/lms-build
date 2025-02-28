import { defineQuery } from "groq";
import { sanityFetch } from "../live";

export async function getStudentByClerkId(clerkId: string) {
	const getStudentByClerkId = defineQuery(
		`*[_type == "student" && clerkId == $clerkId][0]`
	);
		const student = await sanityFetch({
			query: getStudentByClerkId,
			params: { clerkId },
		});

		return student.data;
	
}
