'use client';

import React from "react";
import { useForm } from "react-hook-form";
import { ReleaseFormValues } from "../types/form";

interface Props {
  formId: string;
  title: string;
  description: string;
  liabilityText: string;
}

export const LiabilityForm: React.FC<Props> = ({
  formId,
  title,
  description,
  liabilityText,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<ReleaseFormValues>({
    defaultValues: {
      parentName: "",
      parentEmail: "",
      parentPhone: "",
      childName: "",
      childDOB: "",
      childAddress: "",
      childMedicalNotes: "",
      childDoctor: "",
      childInsurance: "",
      emergencyName: "",
      emergencyPhone: "",
      signature: "",
      dateSigned: new Date().toISOString().slice(0, 10),
      liabilityText,
    },
  });

  const onSubmit = async (data: ReleaseFormValues) => {
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formId, ...data }),
    });
    if (!res.ok) throw new Error("Form submission failed");
  };

  if (isSubmitSuccessful) {
    return (
      <div className="space-y-8 text-xl font-bold">
        <h1>Thank you! We have your form. </h1>
        <h1>Please call / text/ email New City Youth Director John Mack at (661) 889-6291 or john@newcity.church with any questions or concerns.</h1>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="font-bold">{description}</p>
      <p className="p-4 text-sm bg-gray-50 whitespace-pre-line">{liabilityText}</p>

      <input type="hidden" {...register("liabilityText")} className="flex flex-col"/>

      <div>
        <label>
          <p className="font-bold pb-1">*Name - Parent / Guardian / Adult Participant</p>
          <input
            {...register("parentName", { required: true })}
            className="w-full border p-2"
          />
          {errors.parentName && <span className="text-red-500">Required</span>}
        </label>
      </div>
      
      <div>
        <label>
        <p className="font-bold pb-1">*Email - Parent / Guardian / Adult Participant Email</p>
          <input
            type="email"
            {...register("parentEmail", { required: true }, )}
            className="w-full border p-2"
          />
          {errors.parentEmail && <span className="text-red-500">Required</span>}
        </label>
      </div>

      <div>
        <label>
        <p className="font-bold pb-1">*Phone Number - Parent / Guardian / Adult Participant</p>
          <input
            {...register("parentPhone", { required: true})}
            className="w-full border p-2"
          />
          {errors.parentPhone && <span className="text-red-500">Required</span>}
        </label>
      </div>

      <div>
        <label>
        <p className="font-bold">*Child Name</p>
          <p className="text-sm italic pb-1 text-gray-500">One child per line, &quot;N/A&quot; if participant is over 18</p>
          <textarea
            {...register("childName", { required: true })}
            className="w-full border p-2"
            rows={3}
          />
          {errors.childName && <span className="text-red-500">Required</span>}
        </label>
      </div>

      <div>
        <label>
        <p className="font-bold">*Child DOB</p>
          <p className="text-sm italic pb-1 text-gray-500">One child per line, &quot;N/A&quot; if participant is over 18</p>

          <textarea
            {...register("childDOB", { required: true })}
            className="w-full border p-2"
            rows={3}
          />
          {errors.childDOB && <span className="text-red-500">Required</span>}
        </label>
      </div>

      <div>
        <label>
        <p className="font-bold">*Child Address</p>
          <p className="text-sm italic pb-1 text-gray-500">Include, city, state, and zip; &quot;N/A&quot; if participant is over 18</p>

          <input
            {...register("childAddress", { required: true })}
            className="w-full border p-2"
          />
          {errors.childAddress && <span className="text-red-500">Required</span>}
        </label>
      </div>

      <div>
        <label>
        <p className="font-bold">*Participant Special Medical Notes / Medications / Allergies</p>
          <p className="text-sm italic pb-1 text-gray-500">&quot;None&quot; if there are no medical issues or medications to be aware of</p>
          <textarea
            {...register("childMedicalNotes", { required: true })}
            className="w-full border p-2"
            rows={5}
          />
          {errors.childMedicalNotes && <span className="text-red-500">Required</span>}
        </label>
      </div>

      <div>
        <label>
        <p className="font-bold">Participant Doctor and Doctor Phone</p>
          <textarea
            {...register("childDoctor")}
            className="w-full border p-2"
            rows={3}
          />
        </label>
      </div>

      <div>
        <label>
        <p className="font-bold">Participant Insurance</p>
          <textarea
            {...register("childInsurance")}
            className="w-full border p-2"
            rows={3}
          />
        </label>
      </div>

      <div>
        <label>
        <p className="font-bold pb-1">Emergency Contact Name and Relationship to Participant</p>
          <textarea
            {...register("emergencyName")}
            className="w-full border p-2"
            rows={3}
          />
        </label>
      </div>

      <div>
        <label>
        <p className="font-bold pb-1">Emergency Contact Phone Number</p>
          <textarea
            {...register("emergencyPhone")}
            className="w-full border p-2"
            rows={3}
          />
        </label>
      </div>

      <div>
        <label>
        <p className="font-bold">*eSignature by Parent / Guardian / Adult Participant</p>
        <p className="text-sm italic pb-1 text-gray-500">Type your full name</p>
          <input
            {...register("signature", { required: true})}
            className="w-full border p-2"
          />
          {errors.signature && (
            <span className="text-red-500">Digital signature required</span>
          )}
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        {isSubmitting ? "Submitting…" : "Sign and Submit Form"}
      </button>
    </form>
  );
};
