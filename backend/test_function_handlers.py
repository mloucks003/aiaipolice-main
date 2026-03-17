"""
Unit tests for OfficerRadioDispatcher function call handlers
Tests Requirements 7.2 and 7.3
"""
import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, MagicMock
from officer_radio_dispatcher import OfficerRadioDispatcher


class TestFunctionHandlers:
    """Test function call handlers in OfficerRadioDispatcher"""
    
    @pytest.fixture
    def mock_db(self):
        """Create mock database"""
        db = Mock()
        db.persons = Mock()
        db.vehicles = Mock()
        return db
    
    @pytest.fixture
    def mock_websocket(self):
        """Create mock WebSocket"""
        ws = Mock()
        ws.send_text = AsyncMock()
        return ws
    
    @pytest.fixture
    def dispatcher(self, mock_db, mock_websocket):
        """Create dispatcher instance"""
        return OfficerRadioDispatcher(
            officer_id="test_officer_123",
            db=mock_db,
            websocket=mock_websocket
        )
    
    @pytest.mark.asyncio
    async def test_search_person_by_name(self, dispatcher, mock_db):
        """Test person search by first and last name"""
        # Arrange
        mock_person = {
            "first_name": "John",
            "last_name": "Doe",
            "dob": "1985-03-15",
            "drivers_license": "DL12345678",
            "warrants": [{"type": "Failure to Appear"}],
            "priors": []
        }
        mock_db.persons.find = Mock(return_value=Mock(to_list=AsyncMock(return_value=[mock_person])))
        
        # Act
        result = await dispatcher.search_person({
            "first_name": "John",
            "last_name": "Doe"
        })
        
        # Assert
        assert result["found"] is True
        assert result["count"] == 1
        assert len(result["results"]) == 1
        assert result["results"][0]["first_name"] == "John"
        
    @pytest.mark.asyncio
    async def test_search_person_by_drivers_license(self, dispatcher, mock_db):
        """Test person search by driver's license"""
        # Arrange
        mock_person = {
            "first_name": "Jane",
            "last_name": "Smith",
            "dob": "1990-06-10",
            "drivers_license": "DL87654321",
            "warrants": [],
            "priors": [{"offense": "Speeding"}]
        }
        mock_db.persons.find = Mock(return_value=Mock(to_list=AsyncMock(return_value=[mock_person])))
        
        # Act
        result = await dispatcher.search_person({
            "drivers_license": "DL87654321"
        })
        
        # Assert
        assert result["found"] is True
        assert result["count"] == 1
        assert result["results"][0]["drivers_license"] == "DL87654321"
        
    @pytest.mark.asyncio
    async def test_search_person_no_results(self, dispatcher, mock_db):
        """Test person search with no results"""
        # Arrange
        mock_db.persons.find = Mock(return_value=Mock(to_list=AsyncMock(return_value=[])))
        
        # Act
        result = await dispatcher.search_person({
            "first_name": "NonExistent",
            "last_name": "Person"
        })
        
        # Assert
        assert result["found"] is False
        assert result["message"] == "No records found"
        
    @pytest.mark.asyncio
    async def test_search_person_no_parameters(self, dispatcher, mock_db):
        """Test person search with no parameters returns error"""
        # Act
        result = await dispatcher.search_person({})
        
        # Assert
        assert "error" in result
        assert result["error"] == "No search parameters provided"
        
    @pytest.mark.asyncio
    async def test_search_person_database_error(self, dispatcher, mock_db):
        """Test person search handles database errors"""
        # Arrange
        mock_db.persons.find = Mock(side_effect=Exception("Database connection failed"))
        
        # Act
        result = await dispatcher.search_person({
            "first_name": "John"
        })
        
        # Assert
        assert "error" in result
        assert "Database query failed" in result["error"]
        
    @pytest.mark.asyncio
    async def test_search_vehicle_by_plate(self, dispatcher, mock_db):
        """Test vehicle search by license plate"""
        # Arrange
        mock_vehicle = {
            "plate_number": "ABC123",
            "state": "CA",
            "make": "Toyota",
            "model": "Camry",
            "year": 2020,
            "registered_owner": "John Doe",
            "flags": []
        }
        mock_db.vehicles.find = Mock(return_value=Mock(to_list=AsyncMock(return_value=[mock_vehicle])))
        
        # Act
        result = await dispatcher.search_vehicle({
            "plate_number": "ABC123",
            "state": "CA"
        })
        
        # Assert
        assert result["found"] is True
        assert result["count"] == 1
        assert result["results"][0]["plate_number"] == "ABC123"
        assert result["results"][0]["state"] == "CA"
        
    @pytest.mark.asyncio
    async def test_search_vehicle_no_results(self, dispatcher, mock_db):
        """Test vehicle search with no results"""
        # Arrange
        mock_db.vehicles.find = Mock(return_value=Mock(to_list=AsyncMock(return_value=[])))
        
        # Act
        result = await dispatcher.search_vehicle({
            "plate_number": "XYZ999"
        })
        
        # Assert
        assert result["found"] is False
        assert result["message"] == "No records found"
        
    @pytest.mark.asyncio
    async def test_search_vehicle_no_parameters(self, dispatcher, mock_db):
        """Test vehicle search with no parameters returns error"""
        # Act
        result = await dispatcher.search_vehicle({})
        
        # Assert
        assert "error" in result
        assert result["error"] == "No search parameters provided"
        
    @pytest.mark.asyncio
    async def test_search_vehicle_database_error(self, dispatcher, mock_db):
        """Test vehicle search handles database errors"""
        # Arrange
        mock_db.vehicles.find = Mock(side_effect=Exception("Database connection failed"))
        
        # Act
        result = await dispatcher.search_vehicle({
            "plate_number": "ABC123"
        })
        
        # Assert
        assert "error" in result
        assert "Database query failed" in result["error"]
        
    @pytest.mark.asyncio
    async def test_execute_function_person_search(self, dispatcher, mock_db):
        """Test execute_function routes to search_person"""
        # Arrange
        mock_person = {"first_name": "John", "last_name": "Doe"}
        mock_db.persons.find = Mock(return_value=Mock(to_list=AsyncMock(return_value=[mock_person])))
        
        # Act
        result = await dispatcher.execute_function("search_person", {
            "first_name": "John",
            "last_name": "Doe"
        })
        
        # Assert
        assert result["found"] is True
        assert result["count"] == 1
        
    @pytest.mark.asyncio
    async def test_execute_function_vehicle_search(self, dispatcher, mock_db):
        """Test execute_function routes to search_vehicle"""
        # Arrange
        mock_vehicle = {"plate_number": "ABC123", "state": "CA"}
        mock_db.vehicles.find = Mock(return_value=Mock(to_list=AsyncMock(return_value=[mock_vehicle])))
        
        # Act
        result = await dispatcher.execute_function("search_vehicle", {
            "plate_number": "ABC123"
        })
        
        # Assert
        assert result["found"] is True
        assert result["count"] == 1
        
    @pytest.mark.asyncio
    async def test_execute_function_unknown_function(self, dispatcher, mock_db):
        """Test execute_function handles unknown function names"""
        # Act
        result = await dispatcher.execute_function("unknown_function", {})
        
        # Assert
        assert "error" in result
        assert "Unknown function" in result["error"]
        
    @pytest.mark.asyncio
    async def test_search_person_multiple_parameters(self, dispatcher, mock_db):
        """Test person search with multiple parameters (name, DOB, license)"""
        # Arrange
        mock_person = {
            "first_name": "John",
            "last_name": "Doe",
            "dob": "1985-03-15",
            "drivers_license": "DL12345678"
        }
        mock_db.persons.find = Mock(return_value=Mock(to_list=AsyncMock(return_value=[mock_person])))
        
        # Act
        result = await dispatcher.search_person({
            "first_name": "John",
            "last_name": "Doe",
            "dob": "1985-03-15",
            "drivers_license": "DL12345678"
        })
        
        # Assert
        assert result["found"] is True
        # Verify the query was built with all parameters
        call_args = mock_db.persons.find.call_args[0][0]
        assert "first_name" in call_args
        assert "last_name" in call_args
        assert "dob" in call_args
        assert "drivers_license" in call_args


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
