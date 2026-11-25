// Result of a form Server Action, for React's useActionState:
//   const [state, formAction, pending] = useActionState(signIn, initialActionState);
// Lives outside the actions files because a "use server" file may only
// export async functions.
export type ActionState<Field extends string = string> = {
  ok: boolean;
  // Message for the whole form, in Estonian.
  message?: string;
  // Message per field, in Estonian, shown next to the field.
  fieldErrors?: Partial<Record<Field, string>>;
};

export const initialActionState: ActionState = { ok: false };
