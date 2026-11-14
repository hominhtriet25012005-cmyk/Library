package com.library.payload.dto;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPreferencesDTO {
    private Boolean emailDueReminder;
    private Boolean emailOverdueAlert;
    private Boolean emailReservationUpdates;
    private Boolean emailMembershipUpdates;
    private Boolean emailGeneralAnnouncements;
    private Boolean emailAdminReturnRequests;
}
