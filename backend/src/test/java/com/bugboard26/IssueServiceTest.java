package com.bugboard26.issue;

import com.bugboard26.issue.dto.AssignIssueRequest;
import com.bugboard26.issue.dto.CreateIssueRequest;
import com.bugboard26.issue.dto.IssueResponse;
import com.bugboard26.issue.dto.UpdateIssueRequest;
import com.bugboard26.issue.dto.UpdateIssueStatusRequest;
import com.bugboard26.issue.enums.IssuePriority;
import com.bugboard26.issue.enums.IssueStatus;
import com.bugboard26.issue.enums.IssueType;
import com.bugboard26.issue.exception.ForbiddenIssueOperationException;
import com.bugboard26.user.User;
import com.bugboard26.user.UserRepository;
import com.bugboard26.user.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class IssueServiceTest {

    @Mock
    private IssueRepository issueRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private IssueService issueService;

    private User normalUser;
    private User adminUser;
    private User assignedUser;

    @BeforeEach
    void setUp() {
        normalUser = mock(User.class);
        when(normalUser.getId()).thenReturn(1L);
        when(normalUser.getEmail()).thenReturn("user@test.com");
        when(normalUser.getRole()).thenReturn(UserRole.USER);

        adminUser = mock(User.class);
        when(adminUser.getId()).thenReturn(2L);
        when(adminUser.getEmail()).thenReturn("admin@test.com");
        when(adminUser.getRole()).thenReturn(UserRole.ADMIN);

        assignedUser = mock(User.class);
        when(assignedUser.getId()).thenReturn(3L);
        when(assignedUser.getEmail()).thenReturn("member@test.com");
        when(assignedUser.getRole()).thenReturn(UserRole.USER);
    }

    @Test
    void create_conIssueValida_creaIssueConStatoTodo() {
        CreateIssueRequest request = mock(CreateIssueRequest.class);

        when(request.getTitle()).thenReturn("Errore login");
        when(request.getDescription()).thenReturn("Il sistema non consente l'accesso con credenziali valide");
        when(request.getType()).thenReturn(IssueType.BUG);
        when(request.getPriority()).thenReturn(IssuePriority.HIGH);
        when(request.getDueDate()).thenReturn(null);
        when(request.getAssignedToEmail()).thenReturn(null);

        when(userRepository.findByEmail("user@test.com"))
                .thenReturn(Optional.of(normalUser));

        when(issueRepository.save(any(Issue.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        IssueResponse response = issueService.create(request, null, "user@test.com");

        assertNotNull(response);

        ArgumentCaptor<Issue> issueCaptor = ArgumentCaptor.forClass(Issue.class);
        verify(issueRepository).save(issueCaptor.capture());

        Issue savedIssue = issueCaptor.getValue();

        assertEquals("Errore login", savedIssue.getTitle());
        assertEquals("Il sistema non consente l'accesso con credenziali valide", savedIssue.getDescription());
        assertEquals(IssueType.BUG, savedIssue.getType());
        assertEquals(IssuePriority.HIGH, savedIssue.getPriority());
        assertEquals(IssueStatus.TODO, savedIssue.getStatus());
        assertEquals(normalUser, savedIssue.getCreatedBy());
        assertNull(savedIssue.getImageUrl());
    }

    @Test
    void create_senzaPriorita_creaIssueSenzaErrore() {
        CreateIssueRequest request = mock(CreateIssueRequest.class);

        when(request.getTitle()).thenReturn("Domanda sulla documentazione");
        when(request.getDescription()).thenReturn("Una sezione della guida non è chiara");
        when(request.getType()).thenReturn(IssueType.QUESTION);
        when(request.getPriority()).thenReturn(null);
        when(request.getDueDate()).thenReturn(null);
        when(request.getAssignedToEmail()).thenReturn(null);

        when(userRepository.findByEmail("user@test.com"))
                .thenReturn(Optional.of(normalUser));

        when(issueRepository.save(any(Issue.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        IssueResponse response = issueService.create(request, null, "user@test.com");

        assertNotNull(response);

        ArgumentCaptor<Issue> issueCaptor = ArgumentCaptor.forClass(Issue.class);
        verify(issueRepository).save(issueCaptor.capture());

        Issue savedIssue = issueCaptor.getValue();

        assertEquals("Domanda sulla documentazione", savedIssue.getTitle());
        assertEquals(IssueType.QUESTION, savedIssue.getType());
        assertNull(savedIssue.getPriority());
        assertEquals(IssueStatus.TODO, savedIssue.getStatus());
    }

    @Test
    void create_userNormaleTentaAssegnazione_lanciaForbiddenIssueOperationException() {
        CreateIssueRequest request = mock(CreateIssueRequest.class);

        when(request.getTitle()).thenReturn("Problema documentazione");
        when(request.getDescription()).thenReturn("Una sezione della guida non è chiara");
        when(request.getType()).thenReturn(IssueType.DOCUMENTATION);
        when(request.getPriority()).thenReturn(null);
        when(request.getDueDate()).thenReturn(null);
        when(request.getAssignedToEmail()).thenReturn("member@test.com");

        when(userRepository.findByEmail("user@test.com"))
                .thenReturn(Optional.of(normalUser));

        ForbiddenIssueOperationException exception = assertThrows(
                ForbiddenIssueOperationException.class,
                () -> issueService.create(request, null, "user@test.com")
        );

        assertEquals("Solo gli amministratori possono assegnare issue.", exception.getMessage());

        verify(issueRepository, never()).save(any(Issue.class));
    }

    @Test
    void create_adminCreaIssueAssegnataEScadenzaValida_salvaIssueConCampiAdmin() {
        CreateIssueRequest request = mock(CreateIssueRequest.class);
        LocalDate dueDate = LocalDate.now().plusDays(7);

        when(request.getTitle()).thenReturn("Correggere layout dashboard");
        when(request.getDescription()).thenReturn("Le card non sono allineate correttamente");
        when(request.getType()).thenReturn(IssueType.BUG);
        when(request.getPriority()).thenReturn(IssuePriority.MEDIUM);
        when(request.getDueDate()).thenReturn(dueDate);
        when(request.getAssignedToEmail()).thenReturn("member@test.com");

        when(userRepository.findByEmail("admin@test.com"))
                .thenReturn(Optional.of(adminUser));

        when(userRepository.findByEmail("member@test.com"))
                .thenReturn(Optional.of(assignedUser));

        when(issueRepository.save(any(Issue.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        IssueResponse response = issueService.create(request, null, "admin@test.com");

        assertNotNull(response);

        ArgumentCaptor<Issue> issueCaptor = ArgumentCaptor.forClass(Issue.class);
        verify(issueRepository).save(issueCaptor.capture());

        Issue savedIssue = issueCaptor.getValue();

        assertEquals("Correggere layout dashboard", savedIssue.getTitle());
        assertEquals(IssueStatus.TODO, savedIssue.getStatus());
        assertEquals(IssuePriority.MEDIUM, savedIssue.getPriority());
        assertEquals(assignedUser, savedIssue.getAssignedTo());
        assertEquals(dueDate, savedIssue.getDueDate());
    }

    @Test
    void create_conScadenzaPassata_lanciaIllegalArgumentException() {
        CreateIssueRequest request = mock(CreateIssueRequest.class);

        when(request.getTitle()).thenReturn("Bug con scadenza errata");
        when(request.getDescription()).thenReturn("La scadenza inserita è precedente alla data odierna");
        when(request.getType()).thenReturn(IssueType.BUG);
        when(request.getPriority()).thenReturn(null);
        when(request.getDueDate()).thenReturn(LocalDate.now().minusDays(1));
        when(request.getAssignedToEmail()).thenReturn(null);

        when(userRepository.findByEmail("user@test.com"))
                .thenReturn(Optional.of(normalUser));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> issueService.create(request, null, "user@test.com")
        );

        assertEquals("La scadenza non può essere precedente alla data di oggi.", exception.getMessage());

        verify(issueRepository, never()).save(any(Issue.class));
    }

    @Test
    void create_conFileNonImmagine_lanciaIllegalArgumentException() {
        CreateIssueRequest request = mock(CreateIssueRequest.class);

        MockMultipartFile file = new MockMultipartFile(
                "image",
                "documento.pdf",
                "application/pdf",
                "contenuto fittizio".getBytes()
        );

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> issueService.create(request, file, "user@test.com")
        );

        assertEquals("Il file allegato deve essere un'immagine", exception.getMessage());

        verify(userRepository, never()).findByEmail(anyString());
        verify(issueRepository, never()).save(any(Issue.class));
    }

    @Test
    void updateStatus_adminModificaStato_issueAggiornata() {
        Issue issue = new Issue();
        issue.setTitle("Errore login");
        issue.setDescription("Descrizione valida");
        issue.setType(IssueType.BUG);
        issue.setStatus(IssueStatus.TODO);
        issue.setCreatedBy(adminUser);

        UpdateIssueStatusRequest request = mock(UpdateIssueStatusRequest.class);
        when(request.getStatus()).thenReturn(IssueStatus.RESOLVED);

        when(userRepository.findByEmail("admin@test.com"))
                .thenReturn(Optional.of(adminUser));

        when(issueRepository.findIssueById(20L))
                .thenReturn(Optional.of(issue));

        IssueResponse response = issueService.updateStatus(20L, request, "admin@test.com");

        assertNotNull(response);
        assertEquals(IssueStatus.RESOLVED, issue.getStatus());
    }

    @Test
    void update_utenteNonAssegnatoTentaModifica_lanciaForbiddenIssueOperationException() {
        Issue issue = new Issue();
        issue.setTitle("Bug dashboard");
        issue.setDescription("Descrizione valida");
        issue.setType(IssueType.BUG);
        issue.setStatus(IssueStatus.TODO);
        issue.setAssignedTo(null);
        issue.setCreatedBy(normalUser);

        UpdateIssueRequest request = mock(UpdateIssueRequest.class);
        when(request.getStatus()).thenReturn(IssueStatus.IN_PROGRESS);

        when(userRepository.findByEmail("user@test.com"))
                .thenReturn(Optional.of(normalUser));

        when(issueRepository.findIssueById(30L))
                .thenReturn(Optional.of(issue));

        ForbiddenIssueOperationException exception = assertThrows(
                ForbiddenIssueOperationException.class,
                () -> issueService.update(30L, request, "user@test.com")
        );

        assertEquals("Puoi modificare solo le issue assegnate a te.", exception.getMessage());
    }

    @Test
    void assign_adminAssegnaIssueAUtenteEsistente_salvaIssueAssegnata() {
        Issue issue = new Issue();
        issue.setTitle("Bug layout");
        issue.setDescription("Le card non sono allineate");
        issue.setType(IssueType.BUG);
        issue.setStatus(IssueStatus.TODO);
        issue.setCreatedBy(normalUser);

        AssignIssueRequest request = new AssignIssueRequest("member@test.com");

        when(userRepository.findByEmail("admin@test.com"))
                .thenReturn(Optional.of(adminUser));

        when(issueRepository.findById(40L))
                .thenReturn(Optional.of(issue));

        when(userRepository.findByEmail("member@test.com"))
                .thenReturn(Optional.of(assignedUser));

        when(issueRepository.save(any(Issue.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        IssueResponse response = issueService.assign(40L, request, "admin@test.com");

        assertNotNull(response);
        assertEquals(assignedUser, issue.getAssignedTo());

        verify(issueRepository, times(1)).save(issue);
    }

    @Test
    void assign_userNormaleTentaAssegnazione_lanciaRuntimeException() {
        AssignIssueRequest request = new AssignIssueRequest("member@test.com");

        when(userRepository.findByEmail("user@test.com"))
                .thenReturn(Optional.of(normalUser));

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> issueService.assign(40L, request, "user@test.com")
        );

        assertEquals("Solo gli amministratori possono assegnare issue", exception.getMessage());

        verify(issueRepository, never()).findById(anyLong());
        verify(issueRepository, never()).save(any(Issue.class));
    }
}
